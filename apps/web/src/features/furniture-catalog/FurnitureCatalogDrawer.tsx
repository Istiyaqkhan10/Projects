import React, { useState } from "react";
import { Search, Plus, Tag } from "lucide-react";
import { CatalogItem } from "../../schemas/catalog";

interface FurnitureCatalogDrawerProps {
  items: CatalogItem[];
  onAddFurniture: (item: CatalogItem) => void;
}

export const FurnitureCatalogDrawer: React.FC<FurnitureCatalogDrawerProps> = ({
  items,
  onAddFurniture,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = ["all", ...Array.from(new Set(items.map((i) => i.category)))];

  const filteredItems = items.filter((item) => {
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const formatINR = (paise: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(paise / 100);
  };

  return (
    <aside className="w-80 bg-white border-r border-gray-200 flex flex-col h-full select-none">
      {/* Header & Search */}
      <div className="p-4 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-900 mb-2">Furniture Catalog</h2>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search furniture..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
        </div>

        {/* Category Pills */}
        <div className="flex space-x-1.5 mt-3 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 text-xs rounded-full capitalize whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? "bg-orange-600 text-white font-medium"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Catalog Item List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="bg-white border border-gray-200 rounded-lg p-3 hover:border-orange-300 hover:shadow-sm transition-all"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">
                  {item.category}
                </span>
                <h3 className="text-xs font-semibold text-gray-900 mt-1">{item.name}</h3>
              </div>
              <button
                onClick={() => onAddFurniture(item)}
                className="p-1 rounded bg-orange-50 hover:bg-orange-600 text-orange-600 hover:text-white transition-colors"
                title="Add to room"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">
              {item.description || "Modern interior piece"}
            </p>

            <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
              <span className="font-mono text-[11px] text-gray-500">
                {item.width_m}m × {item.depth_m}m
              </span>
              <div className="flex items-center text-gray-900 font-semibold font-mono">
                <Tag className="w-3 h-3 mr-1 text-gray-400" />
                {formatINR(item.price_paise)}
              </div>
            </div>
          </div>
        ))}

        {filteredItems.length === 0 && (
          <div className="text-center py-8 text-xs text-gray-400">
            No furniture matching your search.
          </div>
        )}
      </div>

      <div className="p-2 border-t border-gray-100 bg-gray-50 text-[10px] text-gray-400 text-center">
        * Prices shown in INR are illustrative demonstration data.
      </div>
    </aside>
  );
};
