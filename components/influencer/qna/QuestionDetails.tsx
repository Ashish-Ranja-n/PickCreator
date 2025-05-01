'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ThumbsUp, ThumbsDown, Check, X, Plus, MessageSquare } from 'lucide-react'; // Added MessageSquare
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow';
import type { Question as QuestionType } from './QuestionList'; // Use the same Question type

// Define Answer interface directly here since QnAClient no longer exports it
interface Answer {
  id: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatar: string;
  };
  createdAt: string;
  upvotes: number;
  downvotes: number;
  isAccepted: boolean;
}

interface QuestionDetailsProps {
    selectedQuestion: QuestionType | null;
    answers: Answer[];
    onVote: (targetType: 'question' | 'answer', targetId: string, voteType: 'upvote' | 'downvote') => void;
    onAcceptAnswer: (answerId: string) => void;
    onNewAnswerSubmit: () => void;
    newAnswerContent: string;
    setNewAnswerContent: (content: string) => void;
    isSubmittingAnswer: boolean; // Renamed for clarity
    currentUserId?: string; // Optional: Needed to check if user can accept answer
}

export default function QuestionDetails({
    selectedQuestion,
    answers,
    onVote,
    onAcceptAnswer,
    onNewAnswerSubmit,
    newAnswerContent,
    setNewAnswerContent,
    isSubmittingAnswer,
    currentUserId, // Assuming we can get the current user ID somehow
}: QuestionDetailsProps) {

    if (!selectedQuestion) {
        return (
            <div className="flex items-center justify-center h-full border border-dashed rounded-lg">
                <p className="text-muted-foreground">Select a question to view details and answers</p>
            </div>
        );
    }

    // Determine if the current user is the author of the question
    // This logic might need adjustment based on how currentUserId is obtained
    const isQuestionAuthor = currentUserId === selectedQuestion.author?.id;

    return (
        <>
            <Card className="mb-4 shadow-sm"> {/* Added subtle shadow */}
                <CardHeader>
                    <div className="flex justify-between items-start gap-4"> {/* Added gap */}
                        <div className="flex-1"> {/* Allow title to wrap */}
                            <CardTitle className="text-xl">{selectedQuestion.title}</CardTitle> {/* Slightly larger title */}
                            <CardDescription>
                                Asked {formatDistanceToNow(new Date(selectedQuestion.createdAt), { addSuffix: true })} by{' '}
                                <span className="font-medium">{selectedQuestion.author?.name || 'Unknown User'}</span>
                            </CardDescription>
                        </div>
                        <div className="flex items-center space-x-1 flex-shrink-0"> {/* Adjusted spacing */}
                            {selectedQuestion.tags.map(tag => (
                                <Badge key={tag} variant="secondary">{tag}</Badge> // Use secondary variant for tags
                            ))}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Use prose for better typography */}
                    <p className="whitespace-pre-wrap prose dark:prose-invert max-w-none">{selectedQuestion.content}</p>
                </CardContent>
                <CardFooter className="flex justify-between items-center"> {/* Added items-center */}
                    <div className="flex items-center space-x-2">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={selectedQuestion.author?.avatar || ''} alt={selectedQuestion.author?.name || 'User'} />
                            <AvatarFallback>{(selectedQuestion.author?.name || 'U').charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        {/* Author name already in description */}
                    </div>
                    <div className="flex items-center space-x-1"> {/* Reduced spacing */}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation(); // Prevent card click if needed
                                onVote('question', selectedQuestion.id, 'upvote');
                            }}
                            aria-label="Upvote question" // Added aria-label
                        >
                            <ThumbsUp className="h-4 w-4 mr-1" />
                            {selectedQuestion.upvotes}
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                onVote('question', selectedQuestion.id, 'downvote');
                            }}
                            aria-label="Downvote question" // Added aria-label
                        >
                            <ThumbsDown className="h-4 w-4 mr-1" />
                            {selectedQuestion.downvotes}
                        </Button>
                    </div>
                </CardFooter>
            </Card>

            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Answers ({answers.length})</h2>

                <Dialog>
                    <DialogTrigger asChild>
                        <Button size="sm"> {/* Smaller button */}
                            <Plus className="mr-2 h-4 w-4" />
                            Add Answer
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                            <DialogTitle>Add an Answer</DialogTitle>
                            <DialogDescription>
                                Share your knowledge and help others. Make sure your answer is clear and addresses the question.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="answer-content">Your Answer</Label>
                                <Textarea
                                    id="answer-content"
                                    value={newAnswerContent}
                                    onChange={(e) => setNewAnswerContent(e.target.value)}
                                    placeholder="Write your answer here..."
                                    rows={5}
                                    className="min-h-[100px]" // Ensure minimum height
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setNewAnswerContent('')}>
                                Cancel
                            </Button>
                            <Button onClick={onNewAnswerSubmit} disabled={isSubmittingAnswer || !newAnswerContent.trim()}> {/* Disable if empty */}
                                {isSubmittingAnswer ? 'Submitting...' : 'Submit Answer'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <ScrollArea className="flex-1 pr-4 -mr-4"> {/* Negative margin to counteract padding */}
                {answers.length === 0 ? (
                    <div className="flex items-center justify-center h-32 text-center border border-dashed rounded-lg">
                        <div>
                            <MessageSquare className="mx-auto h-10 w-10 text-muted-foreground mb-2" /> {/* Added icon */}
                            <p className="text-muted-foreground">No answers yet.</p>
                            <p className="text-sm text-muted-foreground">Be the first to share your knowledge!</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-5"> {/* Increased spacing between answers */}
                        {answers.map(answer => (
                            // Added border, subtle shadow on hover, adjusted padding
                            <Card key={answer.id} className={`transition-all duration-200 ease-in-out border hover:shadow-md ${answer.isAccepted ? 'border-green-400 bg-green-50/50 dark:border-green-600 dark:bg-green-900/20' : 'border-border bg-card'}`}>
                                <CardHeader className="pb-3 pt-4 px-4"> {/* Adjusted padding */}
                                    <div className="flex justify-between items-start gap-3"> {/* Adjusted gap */}
                                        <div className="flex items-center space-x-3 flex-1"> {/* Allow wrap, increased spacing */}
                                            <Avatar className="h-9 w-9 flex-shrink-0"> {/* Slightly larger avatar */}
                                                <AvatarImage src={answer.author?.avatar || ''} alt={answer.author?.name || 'User'} />
                                                <AvatarFallback className="text-sm">{(answer.author?.name || 'U').charAt(0).toUpperCase()}</AvatarFallback> {/* Smaller fallback text */}
                                            </Avatar>
                                            <div className="leading-tight"> {/* Reduced line height */}
                                                <p className="font-semibold text-sm">{answer.author?.name || 'Unknown User'}</p> {/* Bolder name */}
                                                <CardDescription className="text-xs"> {/* Smaller date */}
                                                    Answered {formatDistanceToNow(new Date(answer.createdAt), { addSuffix: true })}
                                                </CardDescription>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2 flex-shrink-0">
                                            {answer.isAccepted && (
                                                // Adjusted accepted badge style
                                                <Badge variant="outline" className="border-green-500 text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-900/30 dark:border-green-700 text-xs px-2 py-0.5">
                                                    <Check className="h-3 w-3 mr-1" />
                                                    Accepted
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </CardHeader>
                                {/* Adjusted padding */}
                                <CardContent className="px-4 pb-3">
                                    <p className="whitespace-pre-wrap prose dark:prose-invert max-w-none text-sm leading-relaxed">{answer.content}</p> {/* Adjusted text size/leading */}
                                </CardContent>
                                {/* Adjusted padding, added border top */}
                                <CardFooter className="flex justify-between items-center px-4 pt-3 pb-3 border-t bg-muted/30">
                                    <div className="flex items-center space-x-1"> {/* Reduced spacing */}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onVote('answer', answer.id, 'upvote')}
                                            aria-label="Upvote answer" // Added aria-label
                                        >
                                            <ThumbsUp className="h-4 w-4 mr-1" />
                                            {answer.upvotes}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onVote('answer', answer.id, 'downvote')}
                                            aria-label="Downvote answer" // Added aria-label
                                        >
                                            <ThumbsDown className="h-4 w-4 mr-1" />
                                            {answer.downvotes}
                                        </Button>
                                    </div>
                                    {/* Only show Accept/Unaccept if the current user is the question author */}
                                    {isQuestionAuthor && (
                                        <Button
                                            variant={answer.isAccepted ? "destructive" : "outline"}
                                            size="sm"
                                            onClick={() => onAcceptAnswer(answer.id)}
                                            aria-label={answer.isAccepted ? "Unaccept answer" : "Accept answer"} // Added aria-label
                                        >
                                            {answer.isAccepted ? (
                                                <>
                                                    <X className="h-4 w-4 mr-1" />
                                                    Unaccept
                                                </>
                                            ) : (
                                                <>
                                                    <Check className="h-4 w-4 mr-1" />
                                                    Accept
                                                </>
                                            )}
                                        </Button>
                                    )}
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </ScrollArea>
        </>
    );
}
