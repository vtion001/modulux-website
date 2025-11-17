"use client"

import { useState } from "react"

interface CalculatorState {
  projectType: string
  roomSize: string
  cabinetType: string
  material: string
  finish: string
  hardware: string
  installation: boolean
  linearMeter: string
  kitchenScope: string
}

const pricing = {
  projectType: {
    kitchen: 1.0,
    bathroom: 0.8,
    bedroom: 0.9,
    office: 0.7,
  },
  roomSize: {
    small: 50000,
    medium: 100000,
    large: 200000,
    xlarge: 350000,
  },
  cabinetType: {
    basic: 1.0,
    premium: 1.5,
    luxury: 2.0,
  },
  material: {
    melamine: 1.0,
    laminate: 1.2,
    wood: 1.8,
    premium: 2.5,
  },
  finish: {
    standard: 1.0,
    painted: 1.3,
    stained: 1.4,
    lacquer: 1.6,
  },
  hardware: {
    basic: 1.0,
    soft_close: 1.2,
    premium: 1.5,
  },
  installation: 0.3,
}

export default function CalculatorPage() {
  const [formData, setFormData] = useState<CalculatorState>({
    projectType: "",
    roomSize: "",
    cabinetType: "",
    material: "",
    finish: "",
    hardware: "",
    installation: false,
    linearMeter: "",
    kitchenScope: "",
  })

  const [estimate, setEstimate] = useState<number | null>(null)

  const calculateEstimate = () => {
    const lm = parseFloat(formData.linearMeter);
    if (!formData.projectType || !formData.cabinetType || isNaN(lm) || lm <= 0) {
      return;
    }

    // Use luxury as the base price per linear meter, then apply tier discounts
    const luxuryBaseRate = pricing.cabinetType.luxury;
    let total = luxuryBaseRate * lm;

    // Apply tier-based discounts off the luxury base price
    if (formData.cabinetType === "premium") {
      total *= 0.9; // 10% discount from luxury for premium tier
    } else if (formData.cabinetType === "basic") {
      total *= 0.8; // 20% total discount from luxury for basic tier
    }

    if (formData.installation) {
      total += luxuryBaseRate * pricing.installation * lm;
    }

    setEstimate(Math.round(total));
  };

  const handleInputChange = (field: keyof CalculatorState, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen bg-background py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">Project Cost Calculator</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Get an instant estimate for your modular cabinet project. This calculator provides approximate pricing based
            on your specifications.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Calculator Form */}
          <div className="bg-card rounded-lg shadow-sm border border-border/40 p-6">
            <h2 className="text-2xl font-semibold text-foreground mb-6">Project Details</h2>

            <div className="space-y-6">
              {/* Project Type */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">Project Type</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: "kitchen", label: "Kitchen" },
                    { value: "bathroom", label: "Bathroom" },
                    { value: "bedroom", label: "Bedroom" },
                    { value: "office", label: "Office" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleInputChange("projectType", option.value)}
                      className={`p-3 rounded-md border text-sm font-medium transition-all duration-200 ${
                        formData.projectType === option.value
                          ? "bg-primary text-white border-primary"
                          : "bg-background border-border/40 text-foreground hover:border-primary/50"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                {formData.projectType === "kitchen" && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-foreground mb-3">Kitchen Cabinet Scope</label>
                    <select
                      value={formData.kitchenScope}
                      onChange={(e) => handleInputChange("kitchenScope", e.target.value)}
                      className="w-full p-3 border border-border/40 rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">Select Scope</option>
                      <option value="base_only">Base Cabinets Only</option>
                      <option value="hanging_only">Hanging Cabinets Only</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Linear Meters */}
              <div>
                <label htmlFor="linearMeter" className="block text-sm font-medium text-foreground mb-3">
                  Linear Meters (total cabinet length)
                </label>
                <input
                  id="linearMeter"
                  type="number"
                  min="1"
                  step="0.1"
                  placeholder="e.g., 8.5"
                  value={formData.linearMeter}
                  onChange={(e) => handleInputChange("linearMeter", e.target.value)}
                  className="w-full p-3 border border-border/40 rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Measure the total length of cabinets you need in meters.
                </p>
              </div>

              {/* Cabinet Type */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">Cabinet Quality</label>
                <div className="space-y-2">
                  {[
                    { value: "basic", label: "Basic", desc: "Standard quality cabinets" },
                    { value: "premium", label: "Premium", desc: "Enhanced features and materials" },
                    { value: "luxury", label: "Luxury", desc: "Top-tier quality and finishes" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleInputChange("cabinetType", option.value)}
                      className={`w-full p-3 rounded-md border text-left transition-all duration-200 ${
                        formData.cabinetType === option.value
                          ? "bg-primary text-white border-primary"
                          : "bg-background border-border/40 text-foreground hover:border-primary/50"
                      }`}
                    >
                      <div className="font-medium">{option.label}</div>
                      <div className="text-sm opacity-80">{option.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Material */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">Material</label>
                <select
                  value={formData.material}
                  onChange={(e) => handleInputChange("material", e.target.value)}
                  className="w-full p-3 border border-border/40 rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Select Material</option>
                  <option value="melamine">Melamine</option>
                  <option value="laminate">Laminate</option>
                  <option value="wood">Solid Wood</option>
                  <option value="premium">Premium Wood</option>
                </select>
              </div>

              {/* Installation */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="installation"
                  checked={formData.installation}
                  onChange={(e) => handleInputChange("installation", e.target.checked)}
                  className="w-4 h-4 text-primary bg-background border-border/40 rounded focus:ring-primary/20"
                />
                <label htmlFor="installation" className="ml-2 text-sm font-medium text-foreground">
                  Include Professional Installation
                </label>
              </div>

              <button
                onClick={calculateEstimate}
                className="w-full bg-primary text-white py-3 px-6 rounded-md font-medium hover:bg-primary/90 transition-colors duration-200"
              >
                Calculate Estimate
              </button>
            </div>
          </div>

          {/* Results */}
          <div className="bg-card rounded-lg shadow-sm border border-border/40 p-6">
            <h2 className="text-2xl font-semibold text-foreground mb-6">Your Estimate</h2>

            {estimate ? (
              <div className="space-y-6">
                <div className="text-center p-6 bg-primary/5 rounded-lg border border-primary/20">
                  <div className="text-3xl font-bold text-primary mb-2">₱{estimate.toLocaleString()}</div>
                  <p className="text-sm text-muted-foreground">Estimated Project Cost</p>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Project Type:</span>
                    <span className="font-medium text-foreground capitalize">{formData.projectType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Linear Meters:</span>
                    <span className="font-medium text-foreground">{formData.linearMeter} m</span>
                  </div>
                  {formData.projectType === "kitchen" && formData.kitchenScope && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Kitchen Scope:</span>
                      <span className="font-medium text-foreground">
                        {formData.kitchenScope === "base_only" ? "Base Cabinets Only" : "Hanging Cabinets Only"}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cabinet Quality:</span>
                    <span className="font-medium text-foreground capitalize">{formData.cabinetType}</span>
                  </div>
                  {formData.material && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Material:</span>
                      <span className="font-medium text-foreground capitalize">{formData.material}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Installation:</span>
                    <span className="font-medium text-foreground">
                      {formData.installation ? "Included" : "Not Included"}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-border/40">
                  <p className="text-xs text-muted-foreground mb-4">
                    * This is an approximate estimate. Final pricing may vary based on specific requirements, site
                    conditions, and material availability.
                  </p>
                  <button className="w-full bg-secondary text-white py-3 px-6 rounded-md font-medium hover:bg-secondary/90 transition-colors duration-200">
                    Request Detailed Quote
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <svg
                  className="w-16 h-16 text-muted-foreground mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-muted-foreground">Fill out the project details to get your estimate</p>
              </div>
            )}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-12 p-6 bg-muted/30 rounded-lg">
          <h3 className="font-semibold text-foreground mb-2">Important Notes:</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Estimates are based on standard configurations and may vary</li>
            <li>• Final pricing depends on specific measurements and requirements</li>
            <li>• Additional costs may apply for custom designs or special materials</li>
            <li>• Contact us for a detailed consultation and accurate quote</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
