'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import axios from 'axios';


export default function AdminDealsPage() {
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    axios.get('/api/admin/deals')
      .then(res => {
        setDeals(res.data.deals || []);
        setError(null);
      })
      .catch(() => {
        setError('Failed to fetch deals');
        setDeals([]);
      })
      .finally(() => setLoading(false));
  }, []);

  // Tab filters
  const inactiveStatuses = ['requested', 'counter-offered', 'cancelled'];
  const activeStatuses = ['accepted', 'ongoing', 'content_approved'];
  const historyStatuses = ['completed'];
  // If you have a specific status for disputes, add it here. Otherwise, leave as empty array.
  const disputeStatuses: string[] = ['disputed'];

  const inactiveDeals = deals.filter(d => inactiveStatuses.includes(d.status));
  const activeDeals = deals.filter(d => activeStatuses.includes(d.status));
  const historyDeals = deals.filter(d => historyStatuses.includes(d.status));
  const disputeDeals = deals.filter(d => disputeStatuses.includes(d.status));

  const renderDealList = (dealList: any[]) => {
    if (loading) return <div className="text-center py-12 text-gray-500">Loading...</div>;
    if (error) return <div className="text-center py-12 text-red-500">{error}</div>;
    if (!dealList.length) return <div className="text-center py-12 text-gray-500">No deals found.</div>;
    return (
      <ul className="flex flex-col gap-4">
        {dealList.map((deal) => (
          <li key={deal._id} className="bg-white rounded-xl shadow-sm p-4 flex flex-col gap-3 md:flex-row md:justify-between md:items-center border border-gray-100 hover:shadow-md transition-all">
            <div className="flex-1 flex flex-col gap-2 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-lg truncate">{deal.dealName}</span>
                <span className="ml-2 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">{deal.status}</span>
              </div>
              <div className="text-sm text-gray-500 truncate">{deal.description}</div>
              <div className="flex flex-wrap gap-2 mt-1">
                <span className="text-xs text-gray-400">Type: {deal.dealType}</span>
                <span className="text-xs text-gray-400">Budget: ₹{deal.budget}</span>
                <span className="text-xs text-gray-400">Total: ₹{deal.totalAmount}</span>
                <span className="text-xs text-gray-400">Created: {new Date(deal.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex flex-col gap-1 mt-2">
                <div className="font-medium text-gray-700">Brand:</div>
                <div className="flex items-center gap-2">
                  {deal.brand?.avatar && <img src={deal.brand.avatar} alt="brand avatar" className="w-7 h-7 rounded-full object-cover" />}
                  <span className="text-sm font-semibold">{deal.brand?.name || 'N/A'}</span>
                  <span className="text-xs text-gray-400">({deal.brand?.email})</span>
                </div>
              </div>
              <div className="flex flex-col gap-1 mt-2">
                <div className="font-medium text-gray-700">Influencers:</div>
                <div className="flex flex-col gap-1">
                  {deal.influencers?.length ? deal.influencers.map((inf: any, idx: number) => (
                    <div key={inf.id || idx} className="flex items-center gap-2 pl-2">
                      {inf.user?.avatar && <img src={inf.user.avatar} alt="influencer avatar" className="w-6 h-6 rounded-full object-cover" />}
                      <span className="text-sm font-medium">{inf.user?.name || inf.name || 'N/A'}</span>
                      <span className="text-xs text-gray-400">({inf.user?.email})</span>
                      <span className="text-xs text-gray-500 ml-2">Status: {inf.status}</span>
                      {inf.offeredPrice && <span className="text-xs text-gray-500 ml-2">Offer: ₹{inf.offeredPrice}</span>}
                    </div>
                  )) : <span className="text-xs text-gray-400 pl-2">No influencers</span>}
                </div>
              </div>
              {deal.contentRequirements && (
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="text-xs text-gray-500">Reels: {deal.contentRequirements.reels}</span>
                  <span className="text-xs text-gray-500">Posts: {deal.contentRequirements.posts}</span>
                  <span className="text-xs text-gray-500">Stories: {deal.contentRequirements.stories}</span>
                  <span className="text-xs text-gray-500">Lives: {deal.contentRequirements.lives}</span>
                </div>
              )}
              {deal.selectedPackage && (
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="text-xs text-blue-600 font-semibold">Package: {deal.selectedPackage.name}</span>
                  <span className="text-xs text-gray-500">Services: {deal.selectedPackage.includedServices}</span>
                  <span className="text-xs text-gray-500">Price: ₹{deal.selectedPackage.totalPrice}</span>
                </div>
              )}
              {deal.productName && (
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="text-xs text-green-700 font-semibold">Product: {deal.productName}</span>
                  <span className="text-xs text-gray-500">Price: ₹{deal.productPrice}</span>
                </div>
              )}
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="text-xs text-gray-500">Payment: {deal.paymentStatus}</span>
                <span className="text-xs text-gray-500">Content Published: {deal.contentPublished ? 'Yes' : 'No'}</span>
                <span className="text-xs text-gray-500">Payment Released: {deal.paymentReleased ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    );
  };

  // ...existing code...

  return (
    <div className="container mx-auto py-8 min-h-screen overflow-y-auto">
      <h1 className="text-3xl font-bold mb-8">Deals Management</h1>
      <Tabs 
        defaultValue="inactive" 
        className="w-full"
      >
        <TabsList className="grid grid-cols-4 mb-8 bg-gray-100/80 backdrop-blur-sm rounded-xl overflow-hidden border border-gray-200 shadow-sm">
          <TabsTrigger 
            value="inactive" 
            className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:shadow-blue-100 transition-all duration-300 py-3"
          >
            Inactive
          </TabsTrigger>
          <TabsTrigger 
            value="active" 
            className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:shadow-blue-100 transition-all duration-300 py-3"
          >
            Active
          </TabsTrigger>
          <TabsTrigger 
            value="disputes" 
            className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:shadow-blue-100 transition-all duration-300 py-3"
          >
            Disputes
          </TabsTrigger>
          <TabsTrigger 
            value="history" 
            className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:shadow-blue-100 transition-all duration-300 py-3"
          >
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inactive" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>All Platform Deals</CardTitle>
              <CardDescription>Monitor and manage all deals on the platform</CardDescription>
            </CardHeader>
            <CardContent>
              {renderDealList(inactiveDeals)}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="active" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Deals</CardTitle>
              <CardDescription>Currently active deals that require attention</CardDescription>
            </CardHeader>
            <CardContent>
              {renderDealList(activeDeals)}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="disputes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Disputed Deals</CardTitle>
              <CardDescription>Deals with reported issues that require admin review</CardDescription>
            </CardHeader>
            <CardContent>
              {renderDealList(disputeDeals)}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Deal History</CardTitle>
              <CardDescription>View the history of completed or archived deals</CardDescription>
            </CardHeader>
            <CardContent>
              {renderDealList(historyDeals)}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}