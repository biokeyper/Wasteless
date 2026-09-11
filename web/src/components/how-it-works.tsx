import { Upload, Heart, Handshake } from "lucide-react"

const steps = [
  {
    icon: Upload,
    title: "Post an Item",
    description: "Upload a photo and describe something useful you no longer need. It takes less than 2 minutes."
  },
  {
    icon: Heart,
    title: "Get Requests", 
    description: "Community members nearby can request your item. Choose who you'd like to give it to."
  },
  {
    icon: Handshake,
    title: "Meet & Share",
    description: "Arrange a convenient pickup time and location. Make a neighbor happy and reduce waste!"
  }
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-16 py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            How WasteLess Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Sharing useful items with your community is simple, safe, and rewarding
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, index) => (
            <div key={step.title} className="text-center group">
              <div className="relative mb-6">
                <div className="w-16 h-16 mx-auto bg-gradient-primary rounded-2xl flex items-center justify-center shadow-card group-hover:shadow-lg transition-all duration-300 group-hover:-translate-y-1">
                  <step.icon className="h-8 w-8 text-primary-foreground" />
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-border -translate-x-8">
                    <div className="w-full h-full bg-gradient-to-r from-primary to-primary-light"></div>
                  </div>
                )}
              </div>
              <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}