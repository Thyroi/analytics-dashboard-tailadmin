"use client";

export type TabId = "towns" | "categories";

interface Tab {
  id: TabId;
  label: string;
}

const TABS: Tab[] = [
  { id: "towns", label: "Towns" },
  { id: "categories", label: "Categorías" },
];

interface DebugTabsProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export default function DebugTabs({ activeTab, onTabChange }: DebugTabsProps) {
  return (
    <div className="border-b border-gray-200 dark:border-gray-700">
      <nav className="flex space-x-8" aria-label="Tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm transition-colors
              ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
