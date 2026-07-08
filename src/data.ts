/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { HealthLog, Conversation, CMSArticle, AppUser, FAQ, Announcement, AuditLog, ProviderInfo, CommunityMessage, AhomkaEntry, SupportForumBoard } from './types';

// Clear out simulated logs for pristine baseline state
export const defaultLogs: HealthLog[] = [];

// Clear out simulated conversations
export const defaultConvs: Conversation[] = [];

// Rich, premium clinical articles for the patient's Education Library
export const defaultArticles: CMSArticle[] = [
  {
    id: 'art-1',
    title: 'Circulatory Hypertension & Sodium Restriction Guidelines',
    category: 'Cardiology',
    readTime: '5 min read',
    author: 'Dr. Aris Jenkins (Clinical Cardiology Lead)',
    summary: 'An evidence-based approach on how sodium intake alters blood pressure levels and triggers vascular strain.',
    content: `Excessive sodium intake is one of the primary lifestyle drivers of elevated blood pressure (hypertension). When you consume high amounts of salt, your body retains extra water to dilute the sodium levels in your blood. This increased fluid volume directly raises the pressure within your arteries, forcing your heart to work significantly harder.

### Core Recommendations:
1. **The 1,500mg Limit**: The American Heart Association recommends that individuals with hypertension limit sodium intake to no more than 1,500 milligrams per day.
2. **Hidden Sources of Salt**: Over 70% of dietary sodium comes from processed, packaged, and restaurant foods. Always check nutritive labels for "Sodium" content.
3. **Use Herb Replacements**: Enhance your meals with natural seasonings such as garlic powder, fresh ginger, rosemary, lemon juice, and black pepper standardly.
4. **The Potassium Offset**: Potassium helps relax blood vessel walls and offsets sodium's fluid-retention effects. Increase your intake of bananas, dry beans, spinach, and sweet potatoes if clinically cleared.`,
    publishedDate: '2026-06-01',
    views: 1420,
    bannerUrl: 'https://images.unsplash.com/photo-1511295742364-92b9345f6852?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'art-2',
    title: 'Circadian Rhythm, Sleep Quality and Parasympathetic Regulation',
    category: 'Circadian Health',
    readTime: '4 min read',
    author: 'Dr. Evelyn Foster (Somnologist & Cardiologist)',
    summary: 'Discover how sleeping cycles control autonomic blood pressure drops and cardioprotective restoration.',
    content: `During a healthy night's sleep, your blood pressure naturally drops by 10% to 20% in a phenomenon known as "nocturnal dipping." This dip represents an essential recovery period controlled by your parasympathetic nervous system, helping to protect both your blood vessels and heart chambers against chronic stress.

### Strategies for Restorative Sleep:
1. **Maintain Consistent Schedules**: Go to bed and wake up at the exact same times daily, even on weekends, to stabilize your internal circadian clock.
2. **Limit Blue Light Exposure**: Screen emissions suppress melatonin synthesis. Turn off phones, tablets, and laptops at least 60 minutes before bedtime.
3. **Optimize the Environment**: Keep your bedroom dark, quiet, and cool (ideally between 65°F and 68°F or 18°C and 20°C).
4. **Limit Evening Stimulants**: Avoid drinking caffeinated beverages or eating heavy, high-sodium meals after 6:00 PM.`,
    publishedDate: '2026-06-03',
    views: 955,
    bannerUrl: 'https://images.unsplash.com/photo-1511295742364-92b9345f6852?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'art-3',
    title: 'Glycemic Index, Millet Substitutes & Glycemic Management',
    category: 'Endocrinology',
    readTime: '6 min read',
    author: 'Dr. Kojo Mensah (Clinical Endocrinology Lead)',
    summary: 'A guides to choosing local grains and post-intake moderate walking to limit blood glucose spikes.',
    content: `Blood glucose management is fundamental to overall metabolic health. When fast-acting simple carbohydrates are consumed, blood sugar spikes, triggering heavy insulin secretion. Over time, high blood sugar patterns lead to cellular insulin resistance and raise cardiovascular risks.

### Nutritional Guidelines & Substitutes:
1. **Prefer Local Complex Grains**: Replace refined white rice, wheat flour bread, or instant noodles with highly nutritional grains such as Sorghum, Brown Millet, Fonio, or Spelt. These grains release glucose slowly into the bloodstream.
2. **The 15-Minute Post-Meal Walk**: Engaging in light to moderate movement (like walking around the neighborhood) for 15 minutes after eating prompts skeletal muscles to immediately absorb excess glucose from the blood for energy, reducing insulin spikes.
3. **The Glycemic Load Factor**: Combine complex carbs with soluble fiber (such as leafy vegetables), healthy fats (omega-3 organic seeds), and pure proteins to delay gastric emptying and slow sugar assimilation.`,
    publishedDate: '2026-06-05',
    views: 1120,
    bannerUrl: 'https://images.unsplash.com/photo-1511295742364-92b9345f6852?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'art-4',
    title: 'Step-by-Step Guide on Correct Blood Pressure Cuff Placement',
    category: 'Clinical Skills',
    readTime: '3 min read',
    author: 'Dr. Sarah Bilal (EHR Clinical Trainer)',
    summary: 'Practical clinical instructions to avoid false elevated readings due to incorrect blood pressure cuff setups.',
    content: `Many patients inadvertently register false elevated blood pressure readings due to simple clinical technique errors. Following standard clinical protocol ensures consistent, decision-grade biometrics logs.

### Step-by-Step Technique:
1. **Correct Position**: Sit in a sturdy chair with your back supported and both feet flat on the floor (never cross your ankles or legs).
2. **Arm Level**: Support your bare arm on a flat surface (like a desk) so that your upper arm is resting exactly at heart-level.
3. **Cuff Placement**: Attach the cuff 1 to 2 centimeters above the elbow crease. The arrow or index mark on the cuff must point directly to the brachial artery on the inside of the elbow.
4. **Cuff Tightness**: Wrap the cuff securely. It should fit snugly but comfortably—allowing exactly two fingers to slip underneath.
5. **Silence is Key**: Sit quietly and rest for 5 minutes before pressing start, and do not talk while the measurement is being taken.`,
    publishedDate: '2026-06-07',
    views: 890,
    bannerUrl: 'https://images.unsplash.com/photo-1511295742364-92b9345f6852?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'art-5',
    title: 'Cardioprotective Yoga and Heart Rate Zone Exercises',
    category: 'Fitness',
    readTime: '5 min read',
    author: 'Coach Fatima Diallo (Rehabilitative Biomechanics)',
    summary: 'Learn how low-impact zone exercises and slow breathing strengthen myocardial elasticity.',
    content: `Regular exercise strengthens your heart muscle, allowing it to pump blood with less effort, which naturally lowers the driving force in your arteries. You do not need extreme high-intensity workouts to reap cardiovascular benefits.

### Core Cardioprotective Exercises:
1. **Zone 2 Aerobic Training**: Zone 2 exercise (conversational pace where you can talk but not sing) is excellent for mitochondrial health. Spend 30 minutes walking, cycling, or swimming 3-4 times weekly.
2. **Isometric Yoga Poses**: Yoga improves artery elasticity. Focus on slow breathing exercises combined with gentle stretches, which turn down sympathetic nervous output immediately.
3. **Warm-ups & Cool-downs**: Spend 5 minutes stretching before and after every session to prevent sudden blood pressure spikes or post-exercise drops.`,
    publishedDate: '2026-06-08',
    views: 742,
    bannerUrl: 'https://images.unsplash.com/photo-1511295742364-92b9345f6852?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'art-6',
    title: 'Dehydration and its Immediate Impact on Blood Pressure',
    category: 'Hydration',
    readTime: '4 min read',
    author: 'Dr. Aris Jenkins (Clinical Cardiology Lead)',
    summary: 'Understanding how blood volume and systemic vascular resistance fluctuate based on water intake.',
    content: `When your body is dehydrated, your blood volume falls, and your brain signals your blood vessels to constrict (narrow) to keep blood flowing to critical organs. This constriction actually causes blood pressure to fluctuate or rise systemically.

### Hydration Rule of Thumb:
1. **Target Intake**: Aim to drink at least 2.5 to 3 liters of clean, room temperature filtered water throughout the day.
2. **Indicators**: Track your hydration status by checking your urine. It should ideally be pale yellow to completely clear.
3. **Spacing Water Intake**: Sip water steadily hour-by-hour rather than chugging large amounts all at once.`,
    publishedDate: '2026-06-09',
    views: 630,
    bannerUrl: 'https://images.unsplash.com/photo-1511295742364-92b9345f6852?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'art-7',
    title: 'Autonomic Biofeedback: Regulating Stress and Heart Rate Variability (HRV)',
    category: 'Mental Fitness',
    readTime: '6 min read',
    author: 'Dr. Evelyn Foster (Autonomic Science specialist)',
    summary: 'Evidence-based deep breathing techniques that stimulate somatic parasympathetic buffers to naturally damp blood pressure spikes.',
    content: `Heart Rate Variability (HRV) is a primary indicator of autonomic nervous coordination. Broadly, high HRV values signal a flexible, resilient response to daily cognitive stressors, while static, unvarying rates suggest heavy sympathetic dominance (fight-or-flight overdrive).
    
### Structured Somatic Practices:
1. **The 5.5-Second Cadence (Resonant Breathing)**: Inhale slowly through your nose for 5.5 seconds, then exhale evenly through relaxed lips for 5.5 seconds. Repeating this six times a minute induces immediate autonomic resonance.
2. **Physiological Sigh (Rapid Stress Deflation)**: Take two rapid successive inhales through the nose, followed by one long, slow sighing exhale through the mouth. This immediately expands collapsed alveoli and down-regulates heart rate metrics.
3. **Daily HRV Reflection Cycles**: Log systemic pain, stress, and mood variables inside your Ahomka Ho Clinical diary. Over several consecutive days, logging can help you identify lifestyle stressors and target stress-reduction strategies.`,
    publishedDate: '2026-06-10',
    views: 450,
    bannerUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'art-8',
    title: 'Somatic Nutrition: Traditional Grains & Insulino-Glycemic Responses',
    category: 'Nutrition',
    readTime: '7 min read',
    author: 'Dr. Kojo Mensah (Metabolic Medicine Lead)',
    summary: 'How ancient whole grains like brown millet, sorghum, and fonio slow glycemic release compared to processed white carbs.',
    content: `Processed or refined simple carbohydrates cause rapid glucose spikes in the bloodstream, triggering high insulin demands and contributing to vascular damage over time. Selecting traditional, high-fiber complex grains naturally slows sugar absorption and protects delicate blood vessel endothelium.

### Glycemic Mitigation Guidelines:
1. **Choose Sorghum & Brown Millet**: Traditional unrefined grains possess a dense protein-fiber envelope, yielding a highly favorable, flat glycemic curve.
2. **Acidic Fermentation (Sourdough/Porridges)**: Utilizing natural fermentation processes (as seen in traditional local high-quality grain porridges) lowers the overall glycemic load by altering starch digestibility.
3. **The Pre-Meal Soluble Fiber Guard**: Consuming dark, leafy green vegetables *before* complex grains or proteins creates a stabilizing gel mesh inside the standard digestive tract, delaying glucose absorption.`,
    publishedDate: '2026-06-10',
    views: 520,
    bannerUrl: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'art-9',
    title: 'Gestational Health: Circulatory Load and Neonatal Vital Indicators',
    category: 'Reproductive Health',
    readTime: '5 min read',
    author: 'Dr. Sarah Bilal (Reproductive Medicine Consultant)',
    summary: 'Clinical indicators to monitor gestational blood pressure fluctuations and guarantee safe circulatory volumes.',
    content: `During pregnancy, a woman's blood volume naturally expands by up to 50% to nurture the developing placenta. This expansion places a continuous workload on the cardiovascular and renal systems, making systematic, step-by-step blood pressure tracking crucial for preeclampsia screening.

### Gestational Cardiovascular Guidance:
1. **Maintain Standard Tracking**: Log resting blood pressure twice daily—once upon waking and once in the evening. Readings exceeding 140/90 mmHg should be immediately reported to your obstetrician.
2. **Recognize Warning Signs**: Contact your maternity provider immediately if you experience persistent headaches, sudden facial or hand swelling, or visual disturbances.
3. **Stay Hydrated**: Drink at least 3 liters of water daily to maintain safe amniotic fluid volumes and support optimal uteroplacental perfusion.`,
    publishedDate: '2026-06-10',
    views: 310,
    bannerUrl: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=600&auto=format&fit=crop&q=80'
  }
];

// Clear out simulated users - App will auto-bootstrap Eddy Boltzmann as admin
export const defaultUsers: AppUser[] = [];

// Clear out simulated library FAQs
export const defaultFAQs: FAQ[] = [];

// Clear out simulated announcements
export const defaultAnnouncements: Announcement[] = [];

// Clear out simulated audit trails
export const defaultAuditLogs: AuditLog[] = [];

// Clear out simulated providers list
export const defaultProviders: ProviderInfo[] = [];

// Clear out simulated community channels
export const defaultCommunityMessages: CommunityMessage[] = [];

// Clear out simulated biometric logs
export const defaultAhomkaEntries: AhomkaEntry[] = [];

// Default support forum boards
export const defaultForumBoards: SupportForumBoard[] = [
  { id: '#nutrition-and-diabetes', label: 'Nutrition & Diabetes', desc: 'Millet eating, glucose spike limits', createdBy: 'System', createdDate: '2026-06-10' },
  { id: '#cardio-wellness', label: 'Cardio Wellness', desc: 'Salt limits, walks, BP baseline stability', createdBy: 'System', createdDate: '2026-06-10' },
  { id: '#mental-fitness', label: 'Mental Fitness', desc: 'Respiration stress reduction & REM sleep', createdBy: 'System', createdDate: '2026-06-10' },
  { id: '#reproductive-health', label: 'Reproductive Health', desc: 'Neonatal care advisory support', createdBy: 'System', createdDate: '2026-06-10' }
];
