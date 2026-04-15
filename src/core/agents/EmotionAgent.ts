export type Mood = 'Happy' | 'Sad' | 'Angry' | 'Stressed' | 'Calm' | 'Confused' | 'Urgent';
export type Intent = 'Assistance' | 'Information' | 'Action' | 'Emotional Support';

export class EmotionAgent {
    private readonly MOOD_MAP: Record<string, Mood> = {
        'urgent': 'Urgent',
        'now': 'Urgent',
        'hurry': 'Urgent',
        'emergency': 'Urgent',
        'hate': 'Angry',
        'terrible': 'Angry',
        'stupid': 'Angry',
        'dumb': 'Angry',
        'scam': 'Angry',
        'wrong': 'Angry',
        'stressed': 'Stressed',
        'worried': 'Stressed',
        'scared': 'Stressed',
        'help': 'Stressed',
        'confused': 'Confused',
        'how': 'Confused',
        'what': 'Confused',
        'thanks': 'Happy',
        'great': 'Happy',
        'good': 'Happy',
        'amazing': 'Happy'
    };

    public detect(input: string): { mood: Mood; intent: Intent; sentiment: number } {
        const text = input.toLowerCase();
        let detectedMood: Mood = 'Calm';
        let detectedIntent: Intent = 'Information';
        let sentiment = 0;

        // Simple Keyword Emotion Mapping
        for (const [key, mood] of Object.entries(this.MOOD_MAP)) {
            if (text.includes(key)) {
                detectedMood = mood;
                if (mood === 'Happy') sentiment = 1;
                if (mood === 'Angry' || mood === 'Stressed') sentiment = -1;
                break;
            }
        }

        // Action Intent Recognition
        if (text.includes('search') || text.includes('find') || text.includes('do') || text.includes('run')) {
            detectedIntent = 'Action';
        } else if (text.includes('help') || text.includes('how')) {
            detectedIntent = 'Assistance';
        } else if (text.includes('feel') || text.includes('am')) {
            detectedIntent = 'Emotional Support';
        }

        return { mood: detectedMood, intent: detectedIntent, sentiment };
    }

    public getToneAdjustment(mood: Mood): { pitch: number; rate: number } {
        switch (mood) {
            case 'Angry': return { pitch: 0.8, rate: 0.9 }; // Lower, slower for de-escalation
            case 'Stressed': return { pitch: 1.1, rate: 0.8 }; // Slightly higher, much slower
            case 'Urgent': return { pitch: 1.2, rate: 1.2 }; // Higher, faster
            case 'Happy': return { pitch: 1.1, rate: 1.05 }; // Cheerful
            case 'Confused': return { pitch: 1.0, rate: 0.9 }; // Careful
            default: return { pitch: 1.0, rate: 1.0 };
        }
    }
}
