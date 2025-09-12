"use client"

import { useState } from "react"
import { LazyImage } from "./lazy-image"

const reviews = [
  {
    id: 1,
    name: "Maria Santos",
    location: "Quezon City",
    rating: 5,
    date: "December 2024",
    review:
      "ModuLux transformed our kitchen completely! The quality of their cabinets is exceptional, and the installation team was professional and efficient. Highly recommended!",
    project: "Kitchen Renovation",
    image: "/placeholder.svg?height=60&width=60&text=MS",
  },
  {
    id: 2,
    name: "Robert Chen",
    location: "Makati City",
    rating: 5,
    date: "November 2024",
    review:
      "Outstanding craftsmanship and attention to detail. Our walk-in closet is now perfectly organized and looks absolutely stunning. Worth every peso!",
    project: "Walk-in Closet",
    image: "/placeholder.svg?height=60&width=60&text=RC",
  },
  {
    id: 3,
    name: "Jennifer Lopez",
    location: "Cebu City",
    rating: 5,
    date: "October 2024",
    review:
      "The team at ModuLux exceeded our expectations. From design to installation, everything was seamless. Our bathroom vanity is both beautiful and functional.",
    project: "Bathroom Renovation",
    image: "/placeholder.svg?height=60&width=60&text=JL",
  },
  {
    id: 4,
    name: "David Tan",
    location: "Davao City",
    rating: 4,
    date: "September 2024",
    review:
      "Great quality cabinets and professional service. The design team helped us maximize our space efficiently. Very satisfied with the results.",
    project: "Office Renovation",
    image: "/placeholder.svg?height=60&width=60&text=DT",
  },
]

export function ReviewsSection() {
  const [currentReview, setCurrentReview] = useState(0)

  const nextReview = () => {
    setCurrentReview((prev) => (prev + 1) % reviews.length)
  }

  const prevReview = () => {
    setCurrentReview((prev) => (prev - 1 + reviews.length) % reviews.length)
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <svg
        key={i}
        className={`w-5 h-5 ${i < rating ? "text-yellow-400" : "text-gray-300"}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))
  }

  return (
    <section className="py-16 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">What Our Clients Say</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Don't just take our word for it. Here's what our satisfied customers have to say about their ModuLux
            experience.
          </p>
        </div>

        <div className="relative max-w-4xl mx-auto">
          <div className="bg-card rounded-lg shadow-sm border border-border/40 p-8">
            <div className="flex items-center mb-6">
              <LazyImage
                src={reviews[currentReview].image}
                alt={reviews[currentReview].name}
                className="w-16 h-16 rounded-full mr-4"
              />
              <div>
                <h3 className="font-semibold text-foreground">{reviews[currentReview].name}</h3>
                <p className="text-sm text-muted-foreground">{reviews[currentReview].location}</p>
                <div className="flex items-center mt-1">{renderStars(reviews[currentReview].rating)}</div>
              </div>
            </div>

            <blockquote className="text-lg text-muted-foreground mb-6 italic">
              "{reviews[currentReview].review}"
            </blockquote>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">{reviews[currentReview].project}</p>
                <p className="text-sm text-muted-foreground">{reviews[currentReview].date}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={prevReview}
                  className="p-2 rounded-full border border-border/40 hover:bg-muted transition-colors duration-200"
                  aria-label="Previous review"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={nextReview}
                  className="p-2 rounded-full border border-border/40 hover:bg-muted transition-colors duration-200"
                  aria-label="Next review"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Review indicators */}
          <div className="flex justify-center mt-6 gap-2">
            {reviews.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentReview(index)}
                className={`w-3 h-3 rounded-full transition-colors duration-200 ${
                  index === currentReview ? "bg-primary" : "bg-muted-foreground/30"
                }`}
                aria-label={`Go to review ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
