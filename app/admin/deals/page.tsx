'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Building2,
  User,
  Calendar,
  DollarSign,
  Package,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';
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

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'requested': { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Clock },
      'counter-offered': { color: 'bg-purple-100 text-purple-700 border-purple-200', icon: AlertTriangle },
      'accepted': { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Clock },
      'ongoing': { color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle },
      'content_approved': { color: 'bg-teal-100 text-teal-700 border-teal-200', icon: CheckCircle },
      'completed': { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle },
      'cancelled': { color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
      'disputed': { color: 'bg-orange-100 text-orange-700 border-orange-200', icon: AlertTriangle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.requested;
    const IconComponent = config.icon;

    return (
      <Badge className={`${config.color} border font-medium flex items-center gap-1`}>
        <IconComponent className="w-3 h-3" />
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const renderDealList = (dealList: any[]) => {
    if (loading) return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-500">Loading deals...</p>
      </div>
    );
    if (error) return (
      <div className="text-center py-12">
        <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-500">{error}</p>
      </div>
    );
    if (!dealList.length) return (
      <div className="text-center py-12">
        <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No deals found.</p>
      </div>
    );

    return (
      <div className="grid gap-4 md:gap-6">
        {dealList.map((deal) => (
          <Card key={deal._id} className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg font-bold text-gray-900 truncate">
                    {deal.dealName}
                  </CardTitle>
                  <CardDescription className="mt-1 line-clamp-2">
                    {deal.description}
                  </CardDescription>
                </div>
                <div className="flex flex-col sm:items-end gap-2">
                  {getStatusBadge(deal.status)}
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Calendar className="w-4 h-4" />
                    {new Date(deal.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Financial Info */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <div>
                    <p className="text-xs text-gray-500">Budget</p>
                    <p className="font-semibold">₹{deal.budget}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="text-xs text-gray-500">Total</p>
                    <p className="font-semibold">₹{deal.totalAmount}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-purple-600" />
                  <div>
                    <p className="text-xs text-gray-500">Type</p>
                    <p className="font-semibold capitalize">{deal.dealType}</p>
                  </div>
                </div>
              </div>

              {/* Brand Info */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Brand
                </h4>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={deal.brand?.avatar} />
                    <AvatarFallback>
                      <Building2 className="w-5 h-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {deal.brand?.name || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {deal.brand?.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Influencers Info */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Influencers ({deal.influencers?.length || 0})
                </h4>
                <div className="space-y-2">
                  {deal.influencers?.length ? deal.influencers.map((inf: any, idx: number) => (
                    <div key={inf.id || idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={inf.user?.avatar} />
                        <AvatarFallback>
                          <User className="w-4 h-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {inf.user?.name || inf.name || 'N/A'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {inf.user?.email}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="text-xs">
                          {inf.status}
                        </Badge>
                        {inf.offeredPrice && (
                          <p className="text-xs text-gray-500 mt-1">₹{inf.offeredPrice}</p>
                        )}
                      </div>
                    </div>
                  )) : (
                    <p className="text-sm text-gray-500 italic">No influencers assigned</p>
                  )}
                </div>
              </div>

              {/* Content Requirements */}
              {deal.contentRequirements && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900">Content Requirements</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {deal.contentRequirements.reels > 0 && (
                      <div className="text-center p-2 bg-blue-50 rounded-lg">
                        <p className="text-lg font-bold text-blue-600">{deal.contentRequirements.reels}</p>
                        <p className="text-xs text-blue-600">Reels</p>
                      </div>
                    )}
                    {deal.contentRequirements.posts > 0 && (
                      <div className="text-center p-2 bg-green-50 rounded-lg">
                        <p className="text-lg font-bold text-green-600">{deal.contentRequirements.posts}</p>
                        <p className="text-xs text-green-600">Posts</p>
                      </div>
                    )}
                    {deal.contentRequirements.stories > 0 && (
                      <div className="text-center p-2 bg-purple-50 rounded-lg">
                        <p className="text-lg font-bold text-purple-600">{deal.contentRequirements.stories}</p>
                        <p className="text-xs text-purple-600">Stories</p>
                      </div>
                    )}
                    {deal.contentRequirements.lives > 0 && (
                      <div className="text-center p-2 bg-red-50 rounded-lg">
                        <p className="text-lg font-bold text-red-600">{deal.contentRequirements.lives}</p>
                        <p className="text-xs text-red-600">Lives</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Package Info */}
              {deal.selectedPackage && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900">Selected Package</h4>
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="font-semibold text-blue-900">{deal.selectedPackage.name}</p>
                    <p className="text-sm text-blue-700 mt-1">{deal.selectedPackage.includedServices}</p>
                    <p className="text-lg font-bold text-blue-600 mt-2">₹{deal.selectedPackage.totalPrice}</p>
                  </div>
                </div>
              )}

              {/* Product Info */}
              {deal.productName && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900">Product</h4>
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="font-semibold text-green-900">{deal.productName}</p>
                    <p className="text-lg font-bold text-green-600 mt-1">₹{deal.productPrice}</p>
                  </div>
                </div>
              )}

              {/* Status Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${deal.paymentStatus === 'paid' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-sm">Payment: {deal.paymentStatus}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${deal.contentPublished ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  <span className="text-sm">Content: {deal.contentPublished ? 'Published' : 'Pending'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${deal.paymentReleased ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  <span className="text-sm">Released: {deal.paymentReleased ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  // ...existing code...

  return (
    <div className="container mx-auto py-6 px-4 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Deals Management</h1>
        <p className="text-gray-600">Monitor and manage all deals across the platform</p>
      </div>

      <Tabs defaultValue="inactive" className="w-full">
        <TabsList className="grid grid-cols-2 sm:grid-cols-4 mb-6 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 w-full">
          <TabsTrigger
            value="inactive"
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm transition-all duration-200 text-sm font-medium"
          >
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">Inactive</span>
              <span className="sm:hidden">Inactive</span>
            </div>
          </TabsTrigger>
          <TabsTrigger
            value="active"
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm transition-all duration-200 text-sm font-medium"
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Active</span>
              <span className="sm:hidden">Active</span>
            </div>
          </TabsTrigger>
          <TabsTrigger
            value="disputes"
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm transition-all duration-200 text-sm font-medium"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span className="hidden sm:inline">Disputes</span>
              <span className="sm:hidden">Issues</span>
            </div>
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm transition-all duration-200 text-sm font-medium"
          >
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              <span className="hidden sm:inline">History</span>
              <span className="sm:hidden">History</span>
            </div>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inactive" className="mt-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-1">Inactive Deals</h2>
            <p className="text-gray-600 text-sm">Requested, counter-offered, and cancelled deals</p>
          </div>
          {renderDealList(inactiveDeals)}
        </TabsContent>

        <TabsContent value="active" className="mt-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-1">Active Deals</h2>
            <p className="text-gray-600 text-sm">Currently active deals requiring attention</p>
          </div>
          {renderDealList(activeDeals)}
        </TabsContent>

        <TabsContent value="disputes" className="mt-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-1">Disputed Deals</h2>
            <p className="text-gray-600 text-sm">Deals with reported issues requiring admin review</p>
          </div>
          {renderDealList(disputeDeals)}
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-1">Deal History</h2>
            <p className="text-gray-600 text-sm">Completed and archived deals</p>
          </div>
          {renderDealList(historyDeals)}
        </TabsContent>
      </Tabs>
    </div>
  );
}