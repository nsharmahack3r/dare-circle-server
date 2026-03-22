export const truths = [
  "What's your biggest fear?",
  "Have you ever lied to your best friend?",
  "What's your most embarrassing moment?",
  "What's the most childish thing you still do?",
  "What's a secret you've never told anyone?",
  "Have you ever cheated on a test?",
  "What's the strangest dream you've ever had?",
  "What's the worst gift you've ever received?",
  "Have you ever blamed someone else for something you did?",
  "What's the most embarrassing thing you've searched online?",
  "What's the biggest lie you've ever told your parents?",
  "What's your guilty pleasure?",
  "Have you ever had a crush on a friend's partner?",
  "What's your most irrational fear?",
  "What's the worst thing you've ever done at school or work?",
];

export const dares = [
  "Do 10 pushups",
  "Sing a song loudly for 30 seconds",
  "Dance for 30 seconds without music",
  "Speak in an accent for the next 2 minutes",
  "Do your best impression of someone in the room",
  "Send the last photo in your gallery to the group",
  "Let someone in the group post anything on your social media",
  "Call someone and sing Happy Birthday",
  "Do 15 jumping jacks right now",
  "Imitate your favorite celebrity for 1 minute",
  "Eat a spoonful of any condiment in the kitchen",
  "Hold a plank for 30 seconds",
  "Do your best robot dance",
  "Say the alphabet backwards",
  "Tell an embarrassing story from your past",
];

export function getRandomQuestion(type: "truth" | "dare"): string {
  const list = type === "truth" ? truths : dares;
  return list[Math.floor(Math.random() * list.length)];
}
