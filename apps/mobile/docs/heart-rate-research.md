# Heart Rate Tracking Research
Date: 10-07-2026

## Option A: Camera-Flash PPG Method
- Phone ka rear camera + flash use karta hai
- User finger camera pe rakhta hai
- Light reflection se pulse detect hoti hai
- Library: react-native-camera ya expo-camera
- Accuracy: Medium (affected by movement)
- Pros: No extra hardware needed
- Cons: User ko finger still rakhni padti hai, background mein nahi chalta

## Option B: Bluetooth Wearable
- External smart band/watch se data aata hai
- Library: react-native-ble-plx
- Accuracy: High (dedicated PPG sensor)
- Pros: Continuous monitoring, accurate, works during workout
- Cons: User ke paas wearable hona chahiye

## Recommendation for Elite Fitness
Option B (Bluetooth wearable) better hai kyunki:
1. Gym members workout ke dauran phone nahi pakad sakte
2. Continuous heart rate monitoring chahiye
3. Accuracy important hai health advice ke liye

## Next Step
Sir se confirm karna hai ki kaunsa approach prefer karenge.
Agar budget concern hai to Option A se start kar sakte hain.