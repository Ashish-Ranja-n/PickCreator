"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Switch } from "@/components/ui/switch";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Plus, Trash2, RefreshCw } from 'lucide-react';

interface AutomationRule {
  _id: string;
  name: string;
  triggerType: 'keyword' | 'all_messages';
  keywords: string[];
  responseTemplate: string;
  delaySeconds: number;
  active: boolean;
  createdAt: string;
}

export default function InstagramAutomationPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  
  // Form state for new rule
  const [formData, setFormData] = useState({
    name: '',
    triggerType: 'keyword',
    keywords: '',
    responseTemplate: '',
    delaySeconds: 0,
    active: true
  });
  
  // Load existing automation rules on component mount
  useEffect(() => {
    loadAutomationRules();
  }, []);
  
  const loadAutomationRules = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/influencer/instagram/automation');
      setRules(response.data.rules || []);
    } catch (error) {
      console.error('Error loading automation rules:', error);
      toast({
        title: "Error",
        description: "Failed to load automation rules. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Add validation for delaySeconds
    if (name === 'delaySeconds') {
      const numValue = Number(value);
      // Ensure the value is within the 0-30 range
      if (numValue < 0 || numValue > 30) {
        // Optionally, provide feedback to the user here (e.g., toast)
        // For now, we just prevent the state update for invalid values
        console.warn("Delay must be between 0 and 30 seconds.");
        return; // Prevent updating state if out of range
      }
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };
  
  const handleCreateRule = async () => {
    try {
      setCreating(true);
      
      // Validate form
      if (!formData.name || !formData.responseTemplate) {
        toast({
          title: "Missing information",
          description: "Please provide a name and response template for your automation rule.",
          variant: "destructive",
        });
        return;
      }
      
      if (formData.triggerType === 'keyword' && !formData.keywords) {
        toast({
          title: "Missing keywords",
          description: "Please provide at least one keyword for your keyword-based automation.",
          variant: "destructive",
        });
        return;
      }
      
      // Format request payload
      const payload = {
        ...formData,
        keywords: formData.keywords.split(',').map(k => k.trim()).filter(Boolean),
        delaySeconds: Number(formData.delaySeconds) || 0
      };
      
      // Send API request
      await axios.post('/api/influencer/instagram/automation', payload);
      
      // Reset form and reload rules
      setFormData({
        name: '',
        triggerType: 'keyword',
        keywords: '',
        responseTemplate: '',
        delaySeconds: 0,
        active: true
      });
      
      toast({
        title: "Success",
        description: "Your automation rule has been created successfully.",
      });
      
      setShowForm(false);
      loadAutomationRules();
    } catch (error) {
      console.error('Error creating automation rule:', error);
      toast({
        title: "Error",
        description: "Failed to create automation rule. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };
  
  const handleDeleteRule = async (ruleId: string) => {
    try {
      setDeleting(ruleId);
      await axios.delete(`/api/influencer/instagram/automation?id=${ruleId}`);
      
      toast({
        title: "Success",
        description: "Automation rule has been deleted successfully.",
      });
      
      loadAutomationRules();
    } catch (error) {
      console.error('Error deleting automation rule:', error);
      toast({
        title: "Error",
        description: "Failed to delete automation rule. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleting(null);
    }
  };
  
  const handleToggleRuleStatus = async (ruleId: string, active: boolean) => {
    try {
      await axios.patch(`/api/influencer/instagram/automation`, {
        ruleId,
        updates: { active: !active }
      });
      
      // Update local state to reflect the change immediately
      setRules(prevRules => 
        prevRules.map(rule => 
          rule._id === ruleId ? { ...rule, active: !active } : rule
        )
      );
      
      toast({
        title: "Success",
        description: `Automation rule has been ${!active ? 'activated' : 'deactivated'}.`,
      });
    } catch (error) {
      console.error('Error toggling rule status:', error);
      toast({
        title: "Error",
        description: "Failed to update automation rule. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="container py-6 space-y-6 min-h-screen pt-16">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-semibold">Instagram Message Automation</h1>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadAutomationRules} 
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            variant="default" 
            size="sm" 
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? 'Cancel' : 'New Automation'}
          </Button>
        </div>
      </div>
      
      {/* Information card about Instagram automation */}
      <Card>
        <CardHeader>
          <CardTitle>About Instagram Automation</CardTitle>
          <CardDescription>
            Set up automated responses to Instagram messages based on triggers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Automated responses help you engage with your Instagram audience even when you're not online. 
            You can create rules that trigger based on specific keywords in incoming messages or set up a default
            response for all messages. Note that Instagram has certain limitations on API message sending
            capabilities, and your account must have the appropriate permissions.
          </p>
        </CardContent>
      </Card>
      
      {/* New automation form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create Automation Rule</CardTitle>
            <CardDescription>
              Set up a new automated response for Instagram messages
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Rule Name</Label>
              <Input 
                id="name"
                name="name"
                placeholder="e.g., Welcome Message"
                value={formData.name}
                onChange={handleFormChange}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="triggerType">Trigger Type</Label>
              <Select 
                value={formData.triggerType} 
                onValueChange={(value) => handleSelectChange('triggerType', value)}
              >
                <SelectTrigger id="triggerType">
                  <SelectValue placeholder="Select trigger type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="keyword">Keyword-based</SelectItem>
                  <SelectItem value="all_messages">All Messages</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {formData.triggerType === 'keyword' && (
              <div className="grid gap-2">
                <Label htmlFor="keywords">Keywords (comma-separated)</Label>
                <Input 
                  id="keywords"
                  name="keywords"
                  placeholder="e.g., pricing, cost, package"
                  value={formData.keywords}
                  onChange={handleFormChange}
                />
                <p className="text-xs text-muted-foreground">
                  Enter keywords separated by commas. The automation will trigger if any of these words appear in an incoming message.
                </p>
              </div>
            )}
            
            <div className="grid gap-2">
              <Label htmlFor="responseTemplate">Response Message</Label>
              <Textarea 
                id="responseTemplate"
                name="responseTemplate"
                placeholder="Enter your automated response message here..."
                rows={4}
                value={formData.responseTemplate}
                onChange={handleFormChange}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="delaySeconds">Response Delay (seconds)</Label>
              <Input 
                id="delaySeconds"
                name="delaySeconds"
                type="number"
                min="0"
                max="30"
                placeholder="0"
                value={formData.delaySeconds}
                onChange={handleFormChange}
              />
              <p className="text-xs text-muted-foreground">
                Add a delay before sending the automated response to make it feel more natural (0-30 seconds).
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch 
                id="active"
                checked={formData.active}
                onCheckedChange={(checked) => handleSwitchChange('active', checked)}
              />
              <Label htmlFor="active">Enable this automation rule</Label>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button 
              onClick={handleCreateRule} 
              disabled={creating}
            >
              {creating ? 'Creating...' : 'Create Rule'}
            </Button>
          </CardFooter>
        </Card>
      )}
      
      {/* List of existing automation rules */}
      <Card>
        <CardHeader>
          <CardTitle>Your Automation Rules</CardTitle>
          <CardDescription>
            Manage your existing Instagram message automation rules
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 flex items-center justify-center">
              <RefreshCw className="animate-spin h-6 w-6 text-muted-foreground" />
            </div>
          ) : rules.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">No automation rules found. Create your first rule to get started.</p>
              {!showForm && (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setShowForm(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Rule
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Response Preview</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.map((rule) => (
                    <TableRow key={rule._id}>
                      <TableCell className="font-medium">{rule.name}</TableCell>
                      <TableCell>
                        {rule.triggerType === 'keyword' 
                          ? `Keywords: ${rule.keywords.join(', ')}` 
                          : 'All Messages'}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {rule.responseTemplate.substring(0, 50)}
                        {rule.responseTemplate.length > 50 ? '...' : ''}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Switch 
                            checked={rule.active}
                            onCheckedChange={() => handleToggleRuleStatus(rule._id, rule.active)}
                          />
                          <span className={rule.active ? 'text-green-600' : 'text-gray-400'}>
                            {rule.active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-red-500">
                              {deleting === rule._id ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete the automation rule "{rule.name}". 
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                className="bg-red-500 hover:bg-red-600"
                                onClick={() => handleDeleteRule(rule._id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 