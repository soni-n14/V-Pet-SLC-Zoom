import { useState } from "react";
import { ArrowLeft, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";

const existingQAs = [
  {
    id: 1,
    question: "How do I keep my pet happy?",
    answer: "Keep all stats above 50% by regularly feeding, playing, and bathing your pet. A happy pet means a happy you! 🎉",
    user: "PetLover123",
    admin: "Admin Sarah",
    date: "2 days ago"
  },
  {
    id: 2,
    question: "When does my pet sleep?",
    answer: "Your pet sleeps between 10 PM and 6 AM. During this time, energy regenerates and stats decay slower. Sweet dreams! 😴",
    user: "NightOwl",
    admin: "Admin Mike",
    date: "3 days ago"
  },
  {
    id: 3,
    question: "What happens if stats get too low?",
    answer: "Low stats affect your pet's mood and happiness. Don't worry though - just interact with your pet to bring them back up! 💪",
    user: "Worried_Owner",
    admin: "Admin Sarah",
    date: "5 days ago"
  },
  {
    id: 4,
    question: "Can I change my pet's name?",
    answer: "Currently, your pet's name is set during selection, but we love the name you chose! It's perfect for them. ❤️",
    user: "NameChanger",
    admin: "Admin Mike",
    date: "1 week ago"
  },
  {
    id: 5,
    question: "How often should I check on my pet?",
    answer: "Check in a few times throughout the day! Your pet loves your attention and will be excited to see you. 🐾",
    user: "BusyBee",
    admin: "Admin Sarah",
    date: "1 week ago"
  },
  {
    id: 6,
    question: "What do the different stats mean?",
    answer: "Hunger and Thirst need food and water, Energy needs rest, Hygiene needs baths, and Happiness reflects overall well-being. Easy! ✨",
    user: "NewUser99",
    admin: "Admin Mike",
    date: "2 weeks ago"
  }
];

const QA = () => {
  const navigate = useNavigate();
  const [question, setQuestion] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // This is just UI - functionality not implemented
    console.log("Question submitted:", question);
    setQuestion("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-foreground">Questions & Answers</h1>
          <p className="text-muted-foreground mt-1">Ask questions and get answers from our admin team</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Existing Q&A */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-6 text-foreground">Recent Questions</h2>
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-6">
              {existingQAs.map((qa) => (
                <Card key={qa.id} className="p-6 hover:shadow-lg transition-shadow">
                  {/* Question */}
                  <div className="mb-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-semibold text-foreground">{qa.question}</h3>
                      <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                        {qa.date}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Asked by <span className="font-medium">{qa.user}</span>
                    </p>
                  </div>

                  {/* Answer */}
                  <div className="bg-primary/5 rounded-lg p-4 border-l-4 border-primary">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <span className="text-sm font-semibold text-primary">{qa.admin}</span>
                    </div>
                    <p className="text-foreground leading-relaxed">{qa.answer}</p>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Ask Question Form */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-foreground">Ask a Question</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Textarea
              placeholder="Type your question here... (Admin will respond soon)"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="min-h-[120px] resize-none"
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={!question.trim()}>
                <Send className="w-4 h-4 mr-2" />
                Submit Question
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default QA;
