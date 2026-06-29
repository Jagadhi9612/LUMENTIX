"use client";

import { motion } from "framer-motion";
import { ArrowRight, BellRing, CheckCircle2, Dumbbell, MapPin, Play, ShieldCheck, Smartphone, Sparkles, Timer, UserRoundCheck } from "lucide-react";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { packages } from "@/lib/data";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { LazyVideo } from "../ui/lazy-video";

const reveal = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 }
};

const videoFeatures = [
  {
    title: "Train with purpose",
    copy: "Strength, cardio, recovery and body tracking in one daily habit.",
    video: "/videos/gym-training.mp4"
  },
  {
    title: "Install the member app",
    copy: "Members get wake-up reminders, gym checklist, food list and weekly body check-ins.",
    video: "/videos/gym-lifestyle.mp4"
  }
];

const memberTools = [
  { icon: BellRing, title: "Gym Alarm", copy: "Wake up, it is time for gym reminders." },
  { icon: CheckCircle2, title: "Before Gym Checklist", copy: "Water, shoes, towel, protein and card." },
  { icon: UserRoundCheck, title: "Body Agent", copy: "Goal-based body composition guidance." },
  { icon: Smartphone, title: "Installable App", copy: "Runs like a phone app with offline shell." }
];

export function Landing() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#050505] text-white">
      <section className="relative min-h-[96vh] px-4 py-5 sm:px-5">
        <LazyVideo className="absolute inset-0 h-full w-full object-cover" src="/videos/gym-hero.mp4" eager autoPlay muted loop playsInline />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,5,5,0.94),rgba(5,5,5,0.58),rgba(5,5,5,0.86))]" />

        <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between gap-3">
          <Link href="/" className="flex min-w-0 items-center gap-2 sm:gap-3">
            <BrandLogo className="h-10 w-20 sm:h-11 sm:w-24" />
            <span className="min-w-0">
              <span className="block font-black tracking-wide">ELITE FITNESS</span>
              <span className="hidden text-xs text-white/55 sm:block">Train Strong. Live Elite.</span>
            </span>
          </Link>
          <div className="hidden items-center gap-7 text-sm text-white/72 md:flex">
            <a href="#member-app">Member App</a>
            <a href="#plans">Plans</a>
            <a href="#videos">Training</a>
            <a href="#location">Location</a>
          </div>
          <Link href="/login">
            <Button variant="secondary">Staff Login</Button>
          </Link>
        </nav>

        <div className="relative z-10 mx-auto flex max-w-7xl flex-col justify-end pb-12 pt-24 md:min-h-[82vh] md:pt-32">
          <motion.div initial="hidden" animate="show" transition={{ staggerChildren: 0.12 }} className="max-w-4xl">
            <motion.div variants={reveal} className="mb-6">
              <BrandLogo className="h-16 w-36 border-white/15 bg-black/75 shadow-[0_18px_48px_rgba(0,0,0,0.42)] sm:h-20 sm:w-44 md:h-24 md:w-56" />
            </motion.div>
            <motion.p variants={reveal} className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-4 py-2 text-sm text-white/78 backdrop-blur">
              <Sparkles size={16} className="text-[#FACC15]" /> Premium gym and member body-maintenance app
            </motion.p>
            <motion.h1 variants={reveal} className="text-4xl font-black leading-[1.05] sm:text-5xl md:text-7xl">
              ELITE FITNESS
            </motion.h1>
            <motion.p variants={reveal} className="mt-5 max-w-2xl text-base leading-7 text-white/74 sm:text-lg md:text-xl">
              A complete gym experience for members and staff: installable member app, wake-up alarm, checklist, food guidance,
              body composition agent, staff dashboard, attendance, payments and member records.
            </motion.p>
            <motion.div variants={reveal} className="mt-8 grid gap-3 sm:flex sm:flex-wrap">
              <Link href="/dashboard">
                <Button>
                  Open Member App <ArrowRight size={18} />
                </Button>
              </Link>
              <a href="#videos">
                <Button variant="secondary">
                  <Play size={18} /> Watch Training
                </Button>
              </a>
            </motion.div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }} className="mt-12 grid gap-3 sm:grid-cols-3">
            {["Install App", "Daily Alarm", "Body Agent"].map((item) => (
              <div key={item} className="rounded-lg border border-white/10 bg-black/35 p-4 text-sm font-bold backdrop-blur">
                {item}
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      <section id="member-app" className="elite-grid px-5 py-16">
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-120px" }} transition={{ staggerChildren: 0.1 }} className="mx-auto max-w-7xl">
          <motion.div variants={reveal} className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold text-[#E10600]">Member App</p>
              <h2 className="mt-2 text-3xl font-black md:text-5xl">Built for daily gym discipline</h2>
            </div>
            <Link href="/dashboard">
              <Button variant="secondary">Try Member Dashboard</Button>
            </Link>
          </motion.div>
          <div className="grid gap-4 md:grid-cols-4">
            {memberTools.map((tool, index) => (
              <motion.div key={tool.title} variants={reveal} transition={{ delay: index * 0.04 }}>
                <Card className="h-full transition hover:-translate-y-1 hover:border-[#E10600]/50">
                  <tool.icon className="text-[#E10600]" />
                  <h3 className="mt-5 text-xl font-black">{tool.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/60">{tool.copy}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      <section id="videos" className="border-y border-white/10 bg-[#0A0A0A] px-5 py-16">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-2">
          {videoFeatures.map((item, index) => (
            <motion.article
              key={item.title}
              initial={{ opacity: 0, y: 26 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-120px" }}
              transition={{ duration: 0.55, delay: index * 0.12 }}
              className="overflow-hidden rounded-lg border border-white/10 bg-[#111111]"
            >
              <LazyVideo className="aspect-video w-full object-cover" src={item.video} autoPlay muted loop playsInline />
              <div className="p-5">
                <h3 className="text-2xl font-black">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/62">{item.copy}</p>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      <section id="plans" className="mx-auto max-w-7xl px-5 py-16">
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-120px" }} transition={{ staggerChildren: 0.1 }}>
          <motion.div variants={reveal} className="mb-8">
            <p className="text-sm font-semibold text-[#E10600]">Membership Plans</p>
            <h2 className="mt-2 text-3xl font-black md:text-5xl">Premium packages for every member journey</h2>
          </motion.div>
          <div className="grid gap-4 md:grid-cols-3">
            {packages.map((pkg) => (
              <motion.div key={pkg.name} variants={reveal}>
                <Card className="h-full transition hover:-translate-y-1 hover:border-[#E10600]/50">
                  <span className="rounded-full px-3 py-1 text-xs font-bold text-black" style={{ backgroundColor: pkg.color }}>
                    {pkg.badge}
                  </span>
                  <h3 className="mt-5 text-2xl font-black">{pkg.name}</h3>
                  <p className="mt-2 text-white/58">{pkg.duration}</p>
                  <p className="mt-6 text-4xl font-black">{pkg.price}</p>
                  <ul className="mt-6 space-y-3 text-sm text-white/70">
                    {["Body agent guidance", "Gym alarm and checklist", "QR membership card"].map((line) => (
                      <li key={line} className="flex gap-2">
                        <CheckCircle2 className="text-[#16A34A]" size={18} /> {line}
                      </li>
                    ))}
                  </ul>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      <section className="bg-[#0A0A0A] px-5 py-16">
        <div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-3">
          {[
            { icon: Dumbbell, title: "Strength Arena", copy: "Progressive training plans for real gym results." },
            { icon: Timer, title: "Daily Discipline", copy: "Reminders, checklists and consistent body check-ins." },
            { icon: ShieldCheck, title: "Staff Control", copy: "Firebase staff login protects records and operations." }
          ].map((item, index) => (
            <motion.div key={item.title} initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.08 }}>
              <Card>
                <item.icon className="text-[#E10600]" />
                <h3 className="mt-5 text-xl font-black">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/60">{item.copy}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="location" className="px-5 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold text-[#E10600]">Location</p>
              <h2 className="mt-2 text-3xl font-black md:text-5xl">Visit Elite Fitness</h2>
            </div>
            <a href="https://maps.app.goo.gl/pEfLsoCxjuEFm7sj7" target="_blank" rel="noreferrer">
              <Button variant="secondary">
                <MapPin size={18} /> Open Google Maps
              </Button>
            </a>
          </div>
          <div className="overflow-hidden rounded-lg border border-white/10 bg-[#111111]">
            <iframe
              title="Elite Fitness location map"
              className="h-[420px] w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src="https://www.google.com/maps?q=Elite%20Fitness%20Lalachervu%20Rajahmundry%20Andhra%20Pradesh&output=embed"
            />
          </div>
        </div>
      </section>

      <footer className="mx-auto flex max-w-7xl flex-col gap-4 border-t border-white/10 px-5 py-10 text-sm text-white/62 md:flex-row md:items-center md:justify-between">
        <span className="flex items-center gap-3">
          <BrandLogo className="h-10 w-20" />
          ELITE FITNESS 2026
        </span>
        <span className="flex items-center gap-2">
          <MapPin size={16} /> Lalachervu, Rajahmundry, Andhra Pradesh
        </span>
        <span className="flex items-center gap-2">
          <ShieldCheck size={16} /> Member app plus protected staff operations
        </span>
      </footer>
    </main>
  );
}
