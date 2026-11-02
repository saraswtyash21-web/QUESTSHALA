import {
  Activity as ActivityIcon, BookOpen, Brain, ChartNoAxesCombined, CircleHelp, Gamepad2,
  CircleDollarSign, GraduationCap, History, House, MessageCircle, MessageSquareText,
  NotebookPen, Settings, ShoppingBag, Sparkles, Star, Map as MapIcon, ScanLine, Users,
} from "lucide-react";

export const appFeatures = [
  { to: "/", label: "Home", icon: House, end: true },
  { to: "/kingdom", label: "Kingdom Map", icon: MapIcon },
  { to: "/syllabus", label: "Syllabus & Topics", icon: GraduationCap },
  { to: "/lessons", label: "Lessons", icon: BookOpen },
  { to: "/practice", label: "Practice Zone", icon: Brain },
  { to: "/problem-bank", label: "Worked Math Bank", icon: BookOpen },
  { to: "/question-library", label: "Question Library", icon: CircleHelp },
  { to: "/scan", label: "Scan Notes", icon: ScanLine },
  { to: "/games", label: "Games", icon: Gamepad2 },
  { to: "/buddy", label: "Ask buddy chat", icon: Sparkles },
  { to: "/companions", label: "AI Buddy Avatars", icon: Users },
  { to: "/notes", label: "Notes", icon: NotebookPen },
  { to: "/progress", label: "Progress", icon: ChartNoAxesCombined },
  { to: "/history", label: "Timed Tests & History", icon: History },
  { to: "/exams", label: "Boards & Exams", icon: ActivityIcon },
  { to: "/profile", label: "Profile & Settings", icon: Settings },
  { to: "/practice", label: "Quizzes", icon: Brain, feedbackOnly: true },
  { to: "/practice", label: "Timed Tests", icon: ActivityIcon, feedbackOnly: true },
  { to: "/profile", label: "Voice / Speech", icon: MessageCircle, feedbackOnly: true },
  { to: "/topic/plant-growth", label: "Topic simulations", icon: Sparkles, feedbackOnly: true },
  { to: "/signup", label: "Login / Sign up", icon: Settings, feedbackOnly: true },
  { to: "/points", label: "Levels and XP", icon: ChartNoAxesCombined, feedbackOnly: true },
  { to: "/points", label: "Ranks", icon: ChartNoAxesCombined, feedbackOnly: true },
  { to: "/", label: "Daily Reward", icon: Star, feedbackOnly: true },
  { to: "/points", label: "Points", icon: CircleDollarSign },
  { to: "/shop", label: "Shop", icon: ShoppingBag },
  { to: "/feedback", label: "Feedback", icon: MessageSquareText },
] as const;

export type AppFeature = (typeof appFeatures)[number];
