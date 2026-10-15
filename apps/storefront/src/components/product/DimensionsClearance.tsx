import React from "react";
import { CheckCircle2, AlertTriangle, Ruler, Box, ShieldCheck, DoorOpen } from "lucide-react";

interface DimensionsClearanceProps {
  widthCm: number;
  heightCm: number;
  depthCm: number;
  seatHeightCm?: number;
  weightKg: number;
  doorwayClearanceMinCm?: number;
}

export function DimensionsClearance({
  widthCm,
  heightCm,
  depthCm,
  seatHeightCm,
  weightKg,
  doorwayClearanceMinCm,
}: DimensionsClearanceProps) {
  // Standard UK Internal Door size is 76.2cm (2ft 6in)
  const STANDARD_UK_DOOR_WIDTH_CM = 76.2;
  const isFitsStandardDoor = doorwayClearanceMinCm
    ? doorwayClearanceMinCm <= STANDARD_UK_DOOR_WIDTH_CM
    : true;

  return (
    <div className="rounded-xl border border-sand-300 bg-sand-100/40 p-5 space-y-5">
      <div className="flex items-center justify-between border-b border-sand-200 pb-3">
        <div className="flex items-center gap-2">
          <Ruler className="w-5 h-5 text-brass-600" />
          <h3 className="font-display text-base font-bold text-navy-950">
            Dimensions & Doorway Clearance
          </h3>
        </div>
        <span className="text-[11px] font-semibold text-navy-600 uppercase tracking-wider">
          Metric (Centimetres)
        </span>
      </div>

      {/* Grid of Key Dimensions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-lg bg-sand-50 border border-sand-200 text-center">
          <span className="text-[11px] text-navy-500 font-medium block">Width</span>
          <span className="font-display text-lg font-bold text-navy-950">
            {widthCm} <span className="text-xs font-normal text-navy-600">cm</span>
          </span>
        </div>
        <div className="p-3 rounded-lg bg-sand-50 border border-sand-200 text-center">
          <span className="text-[11px] text-navy-500 font-medium block">Depth</span>
          <span className="font-display text-lg font-bold text-navy-950">
            {depthCm} <span className="text-xs font-normal text-navy-600">cm</span>
          </span>
        </div>
        <div className="p-3 rounded-lg bg-sand-50 border border-sand-200 text-center">
          <span className="text-[11px] text-navy-500 font-medium block">Height</span>
          <span className="font-display text-lg font-bold text-navy-950">
            {heightCm} <span className="text-xs font-normal text-navy-600">cm</span>
          </span>
        </div>
        <div className="p-3 rounded-lg bg-sand-50 border border-sand-200 text-center">
          <span className="text-[11px] text-navy-500 font-medium block">
            {seatHeightCm ? "Seat Height" : "Net Weight"}
          </span>
          <span className="font-display text-lg font-bold text-navy-950">
            {seatHeightCm ? `${seatHeightCm} cm` : `${weightKg} kg`}
          </span>
        </div>
      </div>

      {/* UK Doorway Clearance Visualizer Callout */}
      {doorwayClearanceMinCm && (
        <div
          className={`p-4 rounded-lg border flex items-start gap-3.5 transition-colors ${
            isFitsStandardDoor
              ? "bg-forest-50/70 border-forest-200 text-forest-950"
              : "bg-amber-50/80 border-amber-200 text-amber-950"
          }`}
        >
          <div className="flex-shrink-0 mt-0.5">
            {isFitsStandardDoor ? (
              <DoorOpen className="w-5 h-5 text-forest-700" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-700" />
            )}
          </div>
          <div className="text-xs leading-relaxed">
            <div className="font-bold mb-0.5 flex items-center gap-1.5">
              <span>
                {isFitsStandardDoor
                  ? "Standard UK Doorway Compatible"
                  : "Requires Wide Hallway / Doorway Access"}
              </span>
            </div>
            <p className="text-navy-700">
              Minimum doorway clearance needed:{" "}
              <strong className="text-navy-950">{doorwayClearanceMinCm} cm</strong>. Standard UK
              internal doorways are <strong>76.2 cm (2ft 6in)</strong>.
              {isFitsStandardDoor
                ? " This piece is designed to navigate standard British hallways and entrance doors with ease."
                : " Please verify your property's stairwells, turns, and entryway widths prior to booking delivery."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
