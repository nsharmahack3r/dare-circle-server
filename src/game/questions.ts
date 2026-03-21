export const truths = [
  "What's your biggest fear?",
  "Have you ever lied to your best friend?",
  "What's your most embarrassing moment?"
];

export const dares = [
  "Do 10 pushups",
  "Sing a song loudly",
  "Dance for 30 seconds"
];

export function getRandomQuestion(type: "truth" | "dare") {
  const list = type === "truth" ? truths : dares;
  return list[Math.floor(Math.random() * list.length)];
}
