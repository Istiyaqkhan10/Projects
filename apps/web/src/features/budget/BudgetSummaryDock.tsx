import React, { useState } from "react";
import { ChevronUp, ChevronDown, Receipt, Info } from "lucide-react";
import { SceneObject } from "../../schemas/scene";
import { CatalogItem } from "../../schemas/catalog";

interface BudgetSummaryDockProps {
  objects: SceneObject[];
  catalogMap: Map<string, CatalogItem>;
}

export const BudgetSummaryDock: React.FC<BudgetSummaryDockProps> = ({
  objects,
  catalogMap,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Authoritative calculation mirrored on frontend for preview
  let subtotalPaise = 0;
  const lineItems = objects.map((obj) => {
    const item = catalogMap.get(obj.catalog_item_id);
    const pricePaise = item ? item.price_paise : 0;
    subtotalPaise += pricePaise;
    return {
      instanceId: obj.instance_id,
      name: item ? item.name : obj.catalog_item_id,
      pricePaise,
    };
  });

  const cgstPaise = Math.round((subtotalPaise * 9) / 100);
  const sgstPaise = Math.round((subtotalPaise * 9) / 100);
  const totalTaxPaise = cgstPaise + sgstPaise;
  const totalPaise = subtotalPaise + totalTaxPaise;

  const formatINR = (paise: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(paise / 100);
  };

  return (
    <div className="bg-white border-t border-gray-200 shadow-lg transition-all duration-200 z-30">
      {/* Expanded Line-Item Breakdown */}
      {isExpanded && (
        <div className="max-h-56 overflow-y-auto px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Furniture Itemized Lines ({lineItems.length})
            </h4>
            <span className="text-[10px] text-gray-400">All prices in INR (Integer Paise Precision)</span>
          </div>
          <div className="space-y-1.5">
            {lineItems.map((line) => (
              <div
                key={line.instanceId}
                className="flex items-center justify-between text-xs py-1 border-b border-gray-100 last:border-0"
              >
                <span className="text-gray-700">{line.name}</span>
                <span className="font-mono font-medium text-gray-900">{formatINR(line.pricePaise)}</span>
              </div>
            ))}
            {lineItems.length === 0 && (
              <p className="text-xs text-gray-400 italic">No furniture placed in room yet.</p>
            )}
          </div>
        </div>
      )}

      {/* Main Bar */}
      <div className="px-6 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-gray-900">Preliminary Budget</span>
              <span className="text-[10px] font-mono bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded">
                GST 18% Applicable
              </span>
            </div>
            <div className="text-[11px] text-gray-500 flex items-center mt-0.5">
              <Info className="w-3 h-3 mr-1 text-gray-400" />
              Subtotal: {formatINR(subtotalPaise)} • CGST (9%): {formatINR(cgstPaise)} • SGST (9%): {formatINR(sgstPaise)}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right">
            <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Estimated Total</span>
            <span className="text-lg font-bold font-mono text-gray-900 tracking-tight">
              {formatINR(totalPaise)}
            </span>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            title={isExpanded ? "Collapse estimate" : "Expand estimate details"}
          >
            {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
};
