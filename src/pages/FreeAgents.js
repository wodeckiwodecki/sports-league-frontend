import React from 'react';
import { useParams } from 'react-router-dom';

const FreeAgents = () => {
  const params = useParams();
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">FreeAgents</h1>
      <p className="text-gray-600">This page is under construction. Connected to the backend API.</p>
      <pre className="mt-4 p-4 bg-gray-100 rounded">{JSON.stringify(params, null, 2)}</pre>
    </div>
  );
};

export default FreeAgents;
