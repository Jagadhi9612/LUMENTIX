"use client";

import { Bell, CalendarClock, CheckCircle2, CreditCard, Download, Dumbbell, Flame, LogIn, Moon, Salad, Scale, Target, UserRound } from "lucide-react";
import { getToken } from "firebase/messaging";
import { httpsCallable } from "firebase/functions";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { functions, getClientMessaging, getFirebaseVapidKey } from "@/lib/firebase";
import { cn } from "@/lib/utils";

type Goal = "Fat Loss" | "Muscle Gain" | "Fitness" | "Strength";
type Sex = "Female" | "Male";

type Profile = {
  name: string;
  age: number;
  sex: Sex;
  height: number;
  weight: number;
  goal: Goal;
  workoutTime: string;
};

type CheckIn = {
  date: string;
  weight: number;
  bodyFat: number;
  bmi: number;
  goal: Goal;
};

type MemberLink = {
  memberId: string;
  phone: string;
  fullName?: string;
  membershipEnd?: string;
  paymentStatus?: "Paid" | "Partial" | "Pending" | "Refunded" | "No Payment";
  paymentUrl?: string;
  reminderMessage?: string;
  linkedAt?: string;
};

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const defaultProfile: Profile = {
  name: "Elite Member",
  age: 28,
  sex: "Male",
  height: 170,
  weight: 72,
  goal: "Fitness",
  workoutTime: "06:00"
};

const checklist = [
  "Water bottle",
  "Towel",
  "Training shoes",
  "Workout clothes",
  "Protein or snack",
  "Membership card",
  "Headphones"
];

const foodByGoal: Record<Goal, string[]> = {
  "Fat Loss": ["Black coffee or lemon water", "Boiled eggs or sprouts", "Fruit after workout", "High-protein lunch", "2.5L water"],
  "Muscle Gain": ["Banana before workout", "Peanut butter sandwich", "Whey or paneer after workout", "Rice with dal/chicken", "3L water"],
  Fitness: ["Banana or dates", "Curd or milk", "Eggs/paneer/chana after workout", "Balanced home meal", "2.5L water"],
  Strength: ["Oats or banana", "Electrolytes", "Protein-rich breakfast", "Carbs with lunch", "Creatine if trainer approved"]
};

function getStoredProfile() {
  if (typeof window === "undefined") {
    return defaultProfile;
  }

  const stored = window.localStorage.getItem("elite-user-profile");
  return stored ? ({ ...defaultProfile, ...JSON.parse(stored) } as Profile) : defaultProfile;
}

function saveProfile(profile: Profile) {
  window.localStorage.setItem("elite-user-profile", JSON.stringify(profile));
}

function bodyFatEstimate(profile: Profile, bmi: number) {
  const sexOffset = profile.sex === "Male" ? 16.2 : 5.4;
  return Math.max(8, Math.min(45, 1.2 * bmi + 0.23 * profile.age - sexOffset));
}

function wakeMessage(profile: Profile) {
  return `Wake up ${profile.name}, it is time for gym. Pack water, towel, shoes, and your ${profile.goal.toLowerCase()} food.`;
}

export function UserDashboard() {
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [done, setDone] = useState<string[]>([]);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [notificationStatus, setNotificationStatus] = useState("Not enabled");
  const [memberLink, setMemberLink] = useState<MemberLink>({ memberId: "", phone: "" });
  const [linkStatus, setLinkStatus] = useState("Link your member ID to receive plan expiry reminders.");

  useEffect(() => {
    const storedProfile = getStoredProfile();
    setProfile(storedProfile);
    setDone(JSON.parse(window.localStorage.getItem("elite-checklist") || "[]") as string[]);
    setCheckIns(JSON.parse(window.localStorage.getItem("elite-body-checkins") || "[]") as CheckIn[]);
    setMemberLink(JSON.parse(window.localStorage.getItem("elite-member-link") || "{\"memberId\":\"\",\"phone\":\"\"}") as MemberLink);
    setNotificationStatus("Notification" in window ? Notification.permission : "Not supported");

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }

    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  useEffect(() => {
    saveProfile(profile);
  }, [profile]);

  useEffect(() => {
    window.localStorage.setItem("elite-checklist", JSON.stringify(done));
  }, [done]);

  useEffect(() => {
    window.localStorage.setItem("elite-body-checkins", JSON.stringify(checkIns));
  }, [checkIns]);

  useEffect(() => {
    window.localStorage.setItem("elite-member-link", JSON.stringify(memberLink));
  }, [memberLink]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const now = new Date();
      const todayKey = now.toISOString().slice(0, 10);
      const lastAlert = window.localStorage.getItem("elite-last-reminder");
      const currentTime = now.toTimeString().slice(0, 5);

      if (currentTime === profile.workoutTime && lastAlert !== todayKey && "Notification" in window && Notification.permission === "granted") {
        new Notification("Wake up, it is time for gym", {
          body: wakeMessage(profile),
          tag: "elite-gym-reminder"
        });
        window.localStorage.setItem("elite-last-reminder", todayKey);
      }
    }, 30000);

    return () => window.clearInterval(timer);
  }, [profile]);

  const lastCheckIn = checkIns[0];
  const previousCheckIn = checkIns[1];
  const weightChange = previousCheckIn ? profile.weight - previousCheckIn.weight : 0;
  const agentAdjustment =
    !previousCheckIn
      ? "Save weekly check-ins so the agent can compare your progress and adjust food/training guidance."
      : profile.goal === "Fat Loss" && weightChange >= 0
        ? "Weight is not dropping yet. Keep protein high, reduce daily calories by 150, and add 10 minutes incline walk."
        : profile.goal === "Muscle Gain" && weightChange <= 0
          ? "Weight is not rising yet. Add one extra carb meal and increase training volume by 2 working sets."
          : "Progress is matching the goal. Keep the current plan and review again after the next weekly check-in.";

  const body = useMemo(() => {
    const heightM = profile.height / 100;
    const bmi = profile.weight / (heightM * heightM);
    const bodyFat = bodyFatEstimate(profile, bmi);
    const leanMass = profile.weight * (1 - bodyFat / 100);
    const bmr = profile.sex === "Male" ? 10 * profile.weight + 6.25 * profile.height - 5 * profile.age + 5 : 10 * profile.weight + 6.25 * profile.height - 5 * profile.age - 161;
    const calories =
      profile.goal === "Fat Loss" ? bmr * 1.35 - 350 : profile.goal === "Muscle Gain" ? bmr * 1.5 + 300 : profile.goal === "Strength" ? bmr * 1.55 + 150 : bmr * 1.4;
    const protein = profile.goal === "Muscle Gain" || profile.goal === "Strength" ? profile.weight * 1.8 : profile.weight * 1.5;

    return {
      bmi,
      bodyFat,
      leanMass,
      calories,
      protein,
      plan:
        profile.goal === "Fat Loss"
          ? "Warm-up 8 min, strength circuit 35 min, incline walk 18 min, stretch 7 min."
          : profile.goal === "Muscle Gain"
            ? "Push/pull/legs split, 4 compound lifts, 3 accessory moves, slow recovery sets."
            : profile.goal === "Strength"
              ? "Heavy compound focus, 5x5 main lift, core bracing, long rest, mobility finish."
              : "Full-body training, cardio intervals, mobility, and steady progressive overload."
    };
  }, [profile]);

  async function requestNotifications() {
    if (!("Notification" in window)) {
      setNotificationStatus("Not supported");
      return;
    }
    const permission = await Notification.requestPermission();
    setNotificationStatus(permission);
  }

  async function linkMemberForReminders() {
    try {
      if (!memberLink.memberId.trim() || !memberLink.phone.trim()) {
        setLinkStatus("Enter your member ID and phone number first.");
        return;
      }

      if (!("Notification" in window)) {
        setLinkStatus("This browser does not support app notifications.");
        return;
      }

      const permission = await Notification.requestPermission();
      setNotificationStatus(permission);
      if (permission !== "granted") {
        setLinkStatus("Allow notifications to receive renewal reminders.");
        return;
      }

      const vapidKey = getFirebaseVapidKey();
      if (!vapidKey) {
        setLinkStatus("Firebase web push key is missing. Staff must add NEXT_PUBLIC_FIREBASE_VAPID_KEY.");
        return;
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      const messaging = await getClientMessaging();
      if (!messaging) {
        setLinkStatus("Firebase notifications are not supported on this browser.");
        return;
      }

      const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration });
      if (!token) {
        setLinkStatus("Notification token was not created. Try again after enabling notifications.");
        return;
      }

      const registerMemberDevice = httpsCallable(functions, "registerMemberDevice");
      const response = await registerMemberDevice({
        memberId: memberLink.memberId.trim(),
        phone: memberLink.phone.trim(),
        token,
        platform: navigator.userAgent
      });
      const data = response.data as Omit<MemberLink, "phone" | "linkedAt">;

      setMemberLink((current) => ({
        ...current,
        ...data,
        phone: current.phone,
        linkedAt: new Date().toISOString()
      }));
      if (data.fullName) {
        updateProfile("name", data.fullName);
      }
      setLinkStatus("Renewal reminders are active for this device.");
    } catch (error) {
      setLinkStatus(error instanceof Error ? error.message : "Could not link this device.");
    }
  }

  async function installApp() {
    if (!installPrompt) {
      setNotificationStatus("Use browser menu to install when prompt is unavailable");
      return;
    }

    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  }

  function updateProfile<K extends keyof Profile>(key: K, value: Profile[K]) {
    setProfile((current) => ({ ...current, [key]: value }));
  }

  function saveCheckIn() {
    const entry = {
      date: new Date().toISOString().slice(0, 10),
      weight: profile.weight,
      bodyFat: Number(body.bodyFat.toFixed(1)),
      bmi: Number(body.bmi.toFixed(1)),
      goal: profile.goal
    };
    setCheckIns((current) => [entry, ...current.filter((item) => item.date !== entry.date)].slice(0, 12));
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#050505]/92 px-4 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <Link href="/dashboard" className="flex min-w-0 items-center gap-2 sm:gap-3">
            <BrandLogo className="h-10 w-20 sm:h-11 sm:w-24" />
            <span className="min-w-0">
              <span className="block font-black">ELITE FITNESS</span>
              <span className="hidden text-xs text-white/55 sm:block">Your gym companion</span>
            </span>
          </Link>
          <Link href="/login" className="shrink-0">
            <Button variant="secondary" className="px-3 sm:px-5">
              <LogIn size={18} /> Staff Login
            </Button>
          </Link>
        </div>
      </header>

      <section className="elite-grid px-4 py-6 md:py-8">
        <div className="mx-auto grid max-w-7xl gap-5 xl:grid-cols-[0.95fr_1.05fr]">
          <Card className="min-w-0">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0 break-words">
                <p className="text-sm font-semibold text-[#E10600]">Wake up, it is time for gym</p>
                <h1 className="mt-2 text-2xl font-black sm:text-3xl md:text-5xl">Good morning, {profile.name}</h1>
                <p className="mt-3 max-w-2xl text-white/64">{wakeMessage(profile)}</p>
              </div>
              <div className="grid gap-2 sm:flex">
                <Button variant="secondary" className="w-full sm:w-auto" onClick={installApp}>
                  <Download size={18} /> Install
                </Button>
                <Button className="w-full sm:w-auto" onClick={requestNotifications}>
                  <Bell size={18} /> Alarm
                </Button>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                <CalendarClock className="text-[#E10600]" />
                <p className="mt-3 text-sm text-white/55">Gym alarm</p>
                <input className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-black/35 px-3 outline-none" type="time" value={profile.workoutTime} onChange={(event) => updateProfile("workoutTime", event.target.value)} />
                <p className="mt-2 text-xs text-white/45">Status: {notificationStatus}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                <Scale className="text-[#FACC15]" />
                <p className="mt-3 text-sm text-white/55">BMI</p>
                <p className="text-3xl font-black">{body.bmi.toFixed(1)}</p>
                <p className="text-xs text-white/45">Body fat est. {body.bodyFat.toFixed(1)}%</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                <Flame className="text-[#16A34A]" />
                <p className="mt-3 text-sm text-white/55">Daily target</p>
                <p className="text-3xl font-black">{Math.round(body.calories)}</p>
                <p className="text-xs text-white/45">{Math.round(body.protein)}g protein</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="mb-5 flex items-center justify-between">
              <div className="min-w-0 break-words">
                <h2 className="text-xl font-black">Body Agent</h2>
                <p className="text-sm text-white/50">Maintains your plan from body composition and goal</p>
              </div>
              <UserRound className="text-[#E10600]" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label>
                <span className="mb-2 block text-sm text-white/65">Name</span>
                <input className="h-11 w-full rounded-lg border border-white/10 bg-black/35 px-3 outline-none" value={profile.name} onChange={(event) => updateProfile("name", event.target.value)} />
              </label>
              <label>
                <span className="mb-2 block text-sm text-white/65">Goal</span>
                <select className="h-11 w-full rounded-lg border border-white/10 bg-[#111111] px-3 outline-none" value={profile.goal} onChange={(event) => updateProfile("goal", event.target.value as Goal)}>
                  {(["Fitness", "Fat Loss", "Muscle Gain", "Strength"] as Goal[]).map((goal) => (
                    <option key={goal}>{goal}</option>
                  ))}
                </select>
              </label>
              <label>
                <span className="mb-2 block text-sm text-white/65">Age</span>
                <input className="h-11 w-full rounded-lg border border-white/10 bg-black/35 px-3 outline-none" type="number" value={profile.age} onChange={(event) => updateProfile("age", Number(event.target.value))} />
              </label>
              <label>
                <span className="mb-2 block text-sm text-white/65">Sex</span>
                <select className="h-11 w-full rounded-lg border border-white/10 bg-[#111111] px-3 outline-none" value={profile.sex} onChange={(event) => updateProfile("sex", event.target.value as Sex)}>
                  <option>Male</option>
                  <option>Female</option>
                </select>
              </label>
              <label>
                <span className="mb-2 block text-sm text-white/65">Height cm</span>
                <input className="h-11 w-full rounded-lg border border-white/10 bg-black/35 px-3 outline-none" type="number" value={profile.height} onChange={(event) => updateProfile("height", Number(event.target.value))} />
              </label>
              <label>
                <span className="mb-2 block text-sm text-white/65">Weight kg</span>
                <input className="h-11 w-full rounded-lg border border-white/10 bg-black/35 px-3 outline-none" type="number" value={profile.weight} onChange={(event) => updateProfile("weight", Number(event.target.value))} />
              </label>
            </div>
          </Card>

          <Card className="xl:col-span-2">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 break-words">
                <div className="mb-2 flex items-center gap-2">
                  <CreditCard className="text-[#FACC15]" />
                  <h2 className="text-xl font-black">Plan Renewal Reminder</h2>
                </div>
                <p className="text-sm text-white/58">{linkStatus}</p>
                {memberLink.membershipEnd && (
                  <p className="mt-2 text-sm text-white/68">
                    Plan expires on <span className="font-bold text-white">{memberLink.membershipEnd}</span>. Payment status:{" "}
                    <span className={memberLink.paymentStatus === "Paid" ? "font-bold text-[#16A34A]" : "font-bold text-[#FACC15]"}>
                      {memberLink.paymentStatus ?? "Pending"}
                    </span>
                  </p>
                )}
                {memberLink.reminderMessage && <p className="mt-2 text-sm text-white/58">{memberLink.reminderMessage}</p>}
              </div>
              <div className="grid w-full gap-3 lg:max-w-xl sm:grid-cols-2">
                <label>
                  <span className="mb-2 block text-sm text-white/65">Member ID</span>
                  <input className="h-11 w-full rounded-lg border border-white/10 bg-black/35 px-3 outline-none" value={memberLink.memberId} onChange={(event) => setMemberLink((current) => ({ ...current, memberId: event.target.value }))} />
                </label>
                <label>
                  <span className="mb-2 block text-sm text-white/65">Phone</span>
                  <input className="h-11 w-full rounded-lg border border-white/10 bg-black/35 px-3 outline-none" value={memberLink.phone} onChange={(event) => setMemberLink((current) => ({ ...current, phone: event.target.value }))} />
                </label>
                <Button className="w-full sm:col-span-1" onClick={linkMemberForReminders}>
                  <Bell size={18} /> Enable Renewal Alerts
                </Button>
                {memberLink.paymentUrl ? (
                  <a href={memberLink.paymentUrl} target="_blank" rel="noreferrer" className="w-full">
                    <Button variant="secondary" className="w-full">
                      <CreditCard size={18} /> Pay/Renew Plan
                    </Button>
                  </a>
                ) : (
                  <Button variant="secondary" className="w-full" disabled>
                    <CreditCard size={18} /> Pay at gym
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>

        <div className="mx-auto mt-5 grid max-w-7xl gap-5 lg:grid-cols-3">
          <Card>
            <div className="mb-5 flex items-center gap-3">
              <CheckCircle2 className="text-[#16A34A]" />
              <h2 className="text-xl font-black">Before Gym</h2>
            </div>
            <div className="space-y-2">
              {checklist.map((item) => {
                const checked = done.includes(item);
                return (
                  <button
                    key={item}
                    className={cn("flex w-full items-center justify-between rounded-lg border px-3 py-3 text-left text-sm", checked ? "border-[#16A34A]/40 bg-[#16A34A]/12" : "border-white/10 bg-white/[0.04]")}
                    onClick={() => setDone((current) => (checked ? current.filter((entry) => entry !== item) : [...current, item]))}
                  >
                    {item}
                    <CheckCircle2 size={18} className={checked ? "text-[#16A34A]" : "text-white/25"} />
                  </button>
                );
              })}
            </div>
          </Card>

          <Card>
            <div className="mb-5 flex items-center gap-3">
              <Salad className="text-[#16A34A]" />
              <h2 className="text-xl font-black">Food To Take</h2>
            </div>
            <div className="space-y-3">
              {foodByGoal[profile.goal].map((item) => (
                <div key={item} className="rounded-lg border border-white/10 bg-white/[0.04] p-3 text-sm text-white/72">
                  {item}
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="mb-5 flex items-center gap-3">
              <Dumbbell className="text-[#E10600]" />
              <h2 className="text-xl font-black">Today Plan</h2>
            </div>
            <p className="rounded-lg border border-white/10 bg-white/[0.04] p-4 text-sm leading-6 text-white/72">{body.plan}</p>
            <div className="mt-4 rounded-lg border border-white/10 bg-black/30 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-bold">
                <Target size={18} className="text-[#FACC15]" /> Agent focus
              </div>
              <p className="text-sm text-white/62">
                Lean mass {body.leanMass.toFixed(1)} kg. Keep protein near {Math.round(body.protein)}g and adjust calories every 14 days from progress.
              </p>
            </div>
          </Card>
        </div>

        <div className="mx-auto mt-5 max-w-7xl">
          <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
            <Card className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <Moon className="text-[#FACC15]" />
                <div className="min-w-0 break-words">
                  <h2 className="font-black">Recovery reminder</h2>
                  <p className="text-sm text-white/58">Sleep 7-8 hours, stretch after workout, and update your measurements weekly.</p>
                </div>
              </div>
              <Link href="/login" className="w-full sm:w-auto">
                <Button variant="secondary" className="w-full sm:w-auto">Open Staff Login</Button>
              </Link>
            </Card>

            <Card>
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0 break-words">
                  <h2 className="font-black">Weekly Body Check-in</h2>
                  <p className="mt-2 text-sm text-white/58">{agentAdjustment}</p>
                </div>
                <Button className="w-full sm:w-auto" onClick={saveCheckIn}>Save Check-in</Button>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
                  <p className="text-xs text-white/45">Last saved</p>
                  <p className="mt-1 font-black">{lastCheckIn?.date ?? "Not saved"}</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
                  <p className="text-xs text-white/45">Weight trend</p>
                  <p className="mt-1 font-black">{previousCheckIn ? `${weightChange >= 0 ? "+" : ""}${weightChange.toFixed(1)} kg` : "Need 2 logs"}</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
                  <p className="text-xs text-white/45">Logs stored</p>
                  <p className="mt-1 font-black">{checkIns.length}/12</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>
    </main>
  );
}
