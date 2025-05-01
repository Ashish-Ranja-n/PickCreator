'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminDealsPage() {

  return (
    <div className="container mx-auto py-8 min-h-screen overflow-y-auto">
      <h1 className="text-3xl font-bold mb-8">Deals Management</h1>
      
      <Tabs 
        defaultValue="all" 
        className="w-full"
      >
        <TabsList className="grid grid-cols-3 mb-8 bg-gray-100/80 backdrop-blur-sm rounded-xl overflow-hidden border border-gray-200 shadow-sm">
          <TabsTrigger 
            value="all" 
            className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:shadow-blue-100 transition-all duration-300 py-3"
          >
            All Deals
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
        </TabsList>
        
        <TabsContent value="all" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>All Platform Deals</CardTitle>
              <CardDescription>Monitor and manage all deals on the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <p>All deals will be displayed here</p>
              </div>
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
              <div className="text-center py-12 text-gray-500">
                <p>Active deals will be displayed here</p>
              </div>
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
              <div className="text-center py-12 text-gray-500">
                <p>Disputed deals will be displayed here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 