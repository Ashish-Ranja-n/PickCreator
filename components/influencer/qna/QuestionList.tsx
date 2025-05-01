'use client';

// Removed import { Question } from './types'; as it's defined below
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ThumbsUp, Check, HelpCircle } from 'lucide-react'; // Added HelpCircle import
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow';

interface QuestionListProps {
  questions: Question[];
  loading: boolean;
  selectedQuestionId: string | null;
  onQuestionSelect: (question: Question) => void;
  loadMore: () => void;
  hasMore: boolean;
}

export default function QuestionList({
  questions,
  loading,
  selectedQuestionId,
  onQuestionSelect,
  loadMore,
  hasMore,
}: QuestionListProps) {
  return (
    <ScrollArea className="flex-1 pr-4">
      {loading && questions.length === 0 ? (
        <div className="flex items-center justify-center h-32">
          <p className="text-muted-foreground">Loading questions...</p> {/* Improved empty state text */}
        </div>
      ) : questions.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-32 text-center">
           <HelpCircle className="w-12 h-12 text-muted-foreground mb-2" /> {/* Added icon */}
          <p className="text-muted-foreground">No questions found matching your criteria.</p> {/* Improved empty state text */}
          <p className="text-sm text-muted-foreground">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map(question => (
            <Card
              key={question.id}
              className={`cursor-pointer transition-all duration-200 ease-in-out hover:shadow-md ${selectedQuestionId === question.id ? 'border-primary shadow-lg' : 'border-border'}`} // Enhanced styling
              onClick={() => onQuestionSelect(question)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{question.title}</CardTitle>
                <CardDescription>
                  Asked {formatDistanceToNow(new Date(question.createdAt), { addSuffix: true })}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <p className="line-clamp-2 text-muted-foreground">{question.content}</p>
              </CardContent>
              <CardFooter className="flex justify-between items-center pt-2"> {/* Ensured items are centered vertically */}
                <div className="flex items-center space-x-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={question.author?.avatar || ''} alt={question.author?.name || 'User'} /> {/* Added null check and fallback */}
                    <AvatarFallback>{(question.author?.name || 'U').charAt(0).toUpperCase()}</AvatarFallback> {/* Added null check and fallback */}
                  </Avatar>
                  <span className="text-sm font-medium text-muted-foreground">{question.author?.name || 'Unknown User'}</span> {/* Added null check and fallback */}
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center text-muted-foreground">
                    <ThumbsUp className="h-4 w-4 mr-1" />
                    <span className="text-sm">{question.upvotes}</span>
                  </div>
                  {question.isAccepted && (
                    <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700"> {/* Adjusted colors for dark mode */}
                      <Check className="h-3 w-3 mr-1" />
                      Answered
                    </Badge>
                  )}
                   <Badge variant="secondary" className="text-xs"> {/* Display answer count */}
                     {(question.answers || []).length} {(question.answers || []).length === 1 ? 'Answer' : 'Answers'}
                   </Badge>
                </div>
              </CardFooter>
            </Card>
          ))}

          {hasMore && (
            <div className="flex justify-center mt-4">
              <Button variant="outline" onClick={loadMore} disabled={loading}>
                {loading ? 'Loading...' : 'Load More Questions'} {/* More specific text */}
              </Button>
            </div>
          )}
        </div>
      )}
    </ScrollArea>
  );
}

// Define Question type here or import from a shared types file
// Make sure this matches the structure used in QnAClient.tsx
interface AnswerStub { // Only need ID for count
  id: string;
}
export interface Question {
  id: string;
  title: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatar: string;
  };
  createdAt: string;
  upvotes: number;
  downvotes: number; // Keep for potential future use if needed by parent
  answers: AnswerStub[]; // Use AnswerStub for list view
  isAccepted: boolean;
  tags: string[];
}
