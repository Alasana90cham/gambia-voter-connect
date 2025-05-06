
import React from 'react';
import MultiStepForm from '@/components/form/MultiStepForm';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2 text-gray-800">Gambia Voter Registration</h1>
            <p className="text-gray-600">Complete the form below to register as a voter in The Gambia</p>
          </div>
          
          <MultiStepForm />
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
