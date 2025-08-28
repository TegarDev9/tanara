// src/app/pages/airdrop.tsx
"use client";
import React, { useState, useCallback } from "react";

// --- Type Definitions ---
interface User {
  name: string;
  balance: string;
  currency: string;
  completedTasks: number;
  totalEarnings: string;
  level: string;
  referrals: number;
}

interface Task {
  id: number;
  title: string;
  description: string;
  category: string;
  reward: string;
  currency: string;
  status: "available" | "in_progress" | "completed";
  progress: number;
  requirements: string;
  estimatedTime: string;
}

interface Category {
  name: string;
  count: number;
  active: boolean;
}

// --- Sample Data ---
const initialUser: User = {
  name: "CryptoUser2025",
  balance: "1,247.50",
  currency: "USDT",
  completedTasks: 23,
  totalEarnings: "892.30",
  level: "Gold",
  referrals: 8,
};

const initialTasks: Task[] = [
  {
    id: 1,
    title: "Follow @CryptoAirdrop2025",
    description: "Follow our official Twitter account and stay updated",
    category: "Social",
    reward: "25.00",
    currency: "USDT",
    status: "available",
    progress: 0,
    requirements: "Must follow and verify account",
    estimatedTime: "2 min",
  },
  {
    id: 2,
    title: "Complete Daily Check-in",
    description: "Check in daily to earn bonus rewards",
    category: "Daily",
    reward: "10.00",
    currency: "USDT",
    status: "available",
    progress: 0,
    requirements: "Login daily for 7 days",
    estimatedTime: "1 min",
  },
  {
    id: 3,
    title: "Share on Instagram Story",
    description: "Share our airdrop announcement on your Instagram story",
    category: "Social",
    reward: "30.00",
    currency: "USDT",
    status: "in_progress",
    progress: 50,
    requirements: "Post story and tag 3 friends",
    estimatedTime: "3 min",
  },
  {
    id: 4,
    title: "Play CryptoRunner Game",
    description: "Reach level 10 in our partner game CryptoRunner",
    category: "Gaming",
    reward: "100.00",
    currency: "USDT",
    status: "available",
    progress: 0,
    requirements: "Install game and reach level 10",
    estimatedTime: "30 min",
  },
  {
    id: 5,
    title: "Invite 5 Friends",
    description: "Invite 5 friends using your referral code",
    category: "Referral",
    reward: "150.00",
    currency: "USDT",
    status: "in_progress",
    progress: 60,
    requirements: "5 successful referral signups",
    estimatedTime: "Varies",
  },
  {
    id: 6,
    title: "Complete KYC Verification",
    description: "Verify your identity to unlock premium tasks",
    category: "Verification",
    reward: "50.00",
    currency: "USDT",
    status: "completed",
    progress: 100,
    requirements: "Upload ID and selfie",
    estimatedTime: "10 min",
  },
  {
    id: 7,
    title: "Join Telegram Community",
    description: "Join our official Telegram group and introduce yourself",
    category: "Social",
    reward: "20.00",
    currency: "USDT",
    status: "available",
    progress: 0,
    requirements: "Join group and send intro message",
    estimatedTime: "2 min",
  },
  {
    id: 8,
    title: "Complete Crypto Quiz",
    description: "Answer 10 questions about cryptocurrency basics",
    category: "Educational",
    reward: "40.00",
    currency: "USDT",
    status: "available",
    progress: 0,
    requirements: "Score at least 70%",
    estimatedTime: "5 min",
  },
  {
    id: 9,
    title: "Connect Wallet",
    description: "Connect your crypto wallet to the platform",
    category: "Setup",
    reward: "15.00",
    currency: "USDT",
    status: "available",
    progress: 0,
    requirements: "Connect MetaMask or similar wallet",
    estimatedTime: "3 min",
  },
  {
    id: 10,
    title: "Weekly Trading Challenge",
    description: "Make 3 successful trades this week",
    category: "Trading",
    reward: "200.00",
    currency: "USDT",
    status: "available",
    progress: 0,
    requirements: "Complete 3 trades with profit",
    estimatedTime: "1 week",
  },
];

const initialCategories: Category[] = [
  { name: "All", count: 10, active: true },
  { name: "Social", count: 3, active: false },
  { name: "Gaming", count: 1, active: false },
  { name: "Daily", count: 1, active: false },
  { name: "Referral", count: 1, active: false },
  { name: "Educational", count: 1, active: false },
];

// --- COMPONENTS ---
const Header: React.FC<{ user: User }> = React.memo(({ user }) => (
  <header className="flex items-center justify-between px-4 py-3 bg-black text-white border-b border-white/20">
    <div className="font-bold text-lg">AirDrop Tasks 2025</div>
    <div className="font-mono flex-none text-sm px-2">
      {user.balance} {user.currency}
    </div>
    <button 
      className="w-9 h-9 flex items-center justify-center rounded-full border border-white hover:bg-white hover:text-black transition-colors"
      aria-label="User profile menu"
      type="button"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="8" r="3" stroke="currentColor" strokeWidth="2"/>
        <path d="M12 14c-4 0-7 2-7 5v1h14v-1c0-3-3-5-7-5z" stroke="currentColor" strokeWidth="2"/>
      </svg>
    </button>
  </header>
));

Header.displayName = "Header";

const Dashboard: React.FC<{ user: User }> = React.memo(({ user }) => (
  <section className="px-4 py-3 bg-black text-white">
    <div>
      <h2 className="font-semibold text-lg mb-1 text-white">
        Welcome back, {user.name}
      </h2>
      <div className="text-xs text-white/60 mb-3">
        Level: <span className="font-medium text-white">{user.level}</span> • {user.referrals} Referrals
      </div>
    </div>
    <div className="grid grid-cols-2 gap-4 mb-2">
      <div className="bg-white text-black rounded-xl p-3 flex flex-col items-center border border-white/20">
        <span className="text-2xl font-bold">{user.completedTasks}</span>
        <span className="text-xs">Tasks Completed</span>
      </div>
      <div className="bg-white text-black rounded-xl p-3 flex flex-col items-center border border-white/20">
        <span className="text-2xl font-bold">{user.totalEarnings}</span>
        <span className="text-xs">Total Earnings</span>
      </div>
    </div>
  </section>
));

Dashboard.displayName = "Dashboard";

const Categories: React.FC<{
  categories: Category[];
  active: string;
  setActive: (cat: string) => void;
}> = React.memo(({ categories, active, setActive }) => {
  const handleCategoryClick = useCallback((categoryName: string) => {
    setActive(categoryName);
  }, [setActive]);

  return (
    <nav className="overflow-x-auto px-4 py-3 bg-black flex gap-2 border-b border-white/20">
      {categories.map((cat) => (
        <button
          key={cat.name}
          onClick={() => handleCategoryClick(cat.name)}
          type="button"
          className={`px-4 py-1.5 rounded-full font-medium text-xs transition-colors whitespace-nowrap
            ${active === cat.name
              ? "bg-white text-black"
              : "bg-black border border-white text-white hover:bg-white hover:text-black"}`}
        >
          {cat.name} ({cat.count})
        </button>
      ))}
    </nav>
  );
});

Categories.displayName = "Categories";

const TaskCard: React.FC<{ task: Task }> = React.memo(({ task }) => {
  const handleTaskAction = useCallback(() => {
    // Handle task completion logic here
    console.log(`Action for task: ${task.title}`);
  }, [task.title]);

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "completed":
        return "text-green-400";
      case "in_progress":
        return "text-blue-400";
      default:
        return "text-white";
    }
  };

  const getButtonText = (status: string): string => {
    switch (status) {
      case "completed":
        return "Claimed";
      case "available":
        return "Complete";
      default:
        return "Resume";
    }
  };

  return (
    <div
      className={`rounded-xl p-4 mb-3 shadow-lg transition-all cursor-pointer border
        ${task.status === "completed" 
          ? "bg-white text-black border-white/20 opacity-70" 
          : "bg-black text-white border-white/20 hover:bg-white hover:text-black hover:border-black"}`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className={`font-semibold text-sm ${task.status === "completed" ? "line-through" : ""}`}>
          {task.title}
        </span>
        <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded transition-colors
          ${task.status === "completed" 
            ? "bg-black text-white" 
            : "bg-white text-black"}`}>
          +{task.reward} {task.currency}
        </span>
      </div>
      <div className={`text-xs mb-1 opacity-80 ${task.status === "completed" ? "line-through" : ""}`}>
        {task.description}
      </div>
      <div className="text-xs italic mb-2 opacity-70">
        Category: <span className="font-bold">{task.category}</span> • Est: {task.estimatedTime}
      </div>
      <div className="mb-2">
        <div className={`relative h-2 rounded-full
          ${task.status === "completed" ? "bg-black/20" : "bg-white/20"}`}>
          <div
            style={{ width: `${task.progress}%` }}
            className={`absolute left-0 h-full rounded-full transition-all
              ${task.status === "completed" ? "bg-black" : "bg-white"}`}
            role="progressbar"
            aria-valuenow={task.progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Task progress: ${task.progress}%`}
          />
        </div>
      </div>
      <div className="flex items-center justify-between mt-1">
        <span className={`text-xs ${getStatusColor(task.status)}`}>
          {task.status === "completed" ? "Completed" :
            task.status === "available" ? "Available" : "In Progress"}
        </span>
        <button
          disabled={task.status === "completed"}
          onClick={handleTaskAction}
          type="button"
          className={`px-3 py-1 rounded-full font-medium text-xs transition-colors
              ${task.status === "available"
                ? "bg-white text-black hover:bg-black hover:text-white border border-white"
                : task.status === "in_progress"
                  ? "bg-black text-white border border-white hover:bg-white hover:text-black"
                  : "bg-gray-600 text-white opacity-50 cursor-not-allowed"}`}
        >
          {getButtonText(task.status)}
        </button>
      </div>
    </div>
  );
});

TaskCard.displayName = "TaskCard";


// --- MAIN PAGE COMPONENT ---
const AirdropPage: React.FC = () => {
  const [user] = useState<User>(initialUser);
  const [tasks] = useState<Task[]>(initialTasks);
  const [categories] = useState<Category[]>(initialCategories);
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const displayedTasks = React.useMemo(() => {
    return activeCategory === "All"
      ? tasks
      : tasks.filter((t) => t.category === activeCategory);
  }, [activeCategory, tasks]);

  const handleCategoryChange = useCallback((category: string) => {
    setActiveCategory(category);
  }, []);

  return (
    <div className="bg-black min-h-screen flex flex-col text-white">
      <Header user={user} />
      <Dashboard user={user} />
      <Categories
        categories={categories}
        active={activeCategory}
        setActive={handleCategoryChange}
      />
      <main className="px-4 pt-3 pb-24 flex-1 bg-black">
        {displayedTasks.length === 0 ? (
          <div className="text-center text-white py-12">
            <svg 
              width="64" 
              height="64" 
              viewBox="0 0 24 24" 
              fill="none" 
              className="mx-auto mb-4 opacity-50"
              aria-hidden="true"
            >
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="white" strokeWidth="2"/>
            </svg>
            <span className="text-xl font-bold">No tasks in this category</span>
            <p className="text-sm text-white/60 mt-2">Check back later or try a different category</p>
          </div>
        ) : (
          displayedTasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))
        )}
      </main>
    </div>
  );
};

AirdropPage.displayName = "AirdropPage";

export default AirdropPage;
