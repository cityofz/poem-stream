import { Eye, PlusSquare, User, Bell } from "lucide-react";

export const APP_NAME = "Poem Stream";
export const MAX_POEM_LENGTH = 10000;

export const PROMPTS = [
  "Write about a color without naming it.",
  "Describe the sound of silence.",
  "Write a poem to your future self.",
  "What does rain smell like on hot pavement?",
  "Write about a forgotten memory.",
  "Describe your favorite time of day.",
  "What is the heaviest thing you carry?",
  "Write from the perspective of a tree.",
  "Describe a dream you can't forget.",
  "Write about the space between two seconds.",
  "What does courage taste like?",
  "Describe the feeling of falling asleep.",
  "Write about a door that should not be opened.",
  "What lies beneath the floorboards?",
  "Describe the first time you saw the ocean.",
  "What happens to your shadow when the lights go out?",
  "Write the history of a key that opens nothing.",
  "Describe the taste of a lie.",
  "Write about a letter you never sent.",
  "How does a mountain measure time?",
  "The secret life of a streetlamp.",
  "Where do you feel anxiety in your body?",
  "If silence had a texture, what would it be?",
  "The moment before the phone rang.",
  "What the mirror sees when you look away.",
  "The sound of a clock in an empty room.",
  "Write about a scar that isn't visible.",
  "Describe the smell of old books.",
  "What does the wind say when it howls?",
  "Write about a path you didn't take.",
  "The feeling of being watched by a painting.",
  "Describe a city that only exists at night.",
  "What does 'goodbye' look like?",
  "Write about the dust in a sunbeam.",
  "The taste of a snowflake.",
  "Describe the moment a match is struck.",
  "Write about a voice you haven't heard in years.",
  "What does forgiveness feel like physically?",
  "Describe the view from a window you don't own.",
  "Write about the sensation of holding your breath.",
  "What is the sound of a heart breaking?",
  "Describe the texture of fog.",
  "Write about a secret you kept for too long.",
  "What does the moon look like to a wolf?",
  "Describe the feeling of being lost in a crowd."
];

export const NAV_ITEMS = [
  { label: 'Read', icon: Eye, view: 'FEED' },
  { label: 'Write', icon: PlusSquare, view: 'RECORD' },
  { label: 'Alerts', icon: Bell, view: 'NOTIFICATIONS' },
  { label: 'Profile', icon: User, view: 'PROFILE' },
];