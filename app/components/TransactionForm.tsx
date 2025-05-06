"use client";

import { useState, useEffect } from 'react';
import { formatUnits, parseUnits } from 'viem';

interface TransactionFormProps {
  initialData?: {
    id?: string;
    date?: string;
    type?: 'income' | 'expense';
    amount?: string;
    coin?: string;
    wallet?: string;
    category?: string;
    description?: string;
    notes?: string;
  };
  categories: string[];
  wallets: string[];
  onSubmit: (data: any) => void;
  onCancel?: () => void;
  onDelete?: (id: string) => void;
}

export default function TransactionForm({
  initialData,
  categories,
  wallets,
  onSubmit,
  onCancel,
  onDelete
}: TransactionFormProps) {
  // Default form data
  const defaultFormData = {
    id: '',
    date: new Date().toISOString().split('T')[0],
    type: 'income' as 'income' | 'expense',
    amount: '',
    coin: 'USDC',
    wallet: wallets.length > 0 ? wallets[0] : '',
    category: categories.length > 0 ? categories[0] : '',
    description: '',
    notes: ''
  };

  // Form state
  const [formData, setFormData] = useState(defaultFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  console.log('TransactionForm rendered with initialData:', initialData);

  // Initialize form with data if editing
  useEffect(() => {
    if (initialData) {
      console.log('Setting form data from initialData:', initialData);
      setFormData({
        ...defaultFormData,
        ...initialData,
        date: initialData.date || defaultFormData.date
      });
    }
  }, [initialData]);

  // Form validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.date) {
      newErrors.date = 'Date is required';
    }
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }
    
    if (!formData.wallet) {
      newErrors.wallet = 'Wallet is required';
    }
    
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    console.log(`Form field ${name} changed to:`, value);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted with data:', formData);
    
    if (!validateForm()) {
      console.log('Form validation failed with errors:', errors);
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Prepare data for submission
      const submissionData = {
        ...formData,
        amount: formData.amount // You might want to convert this to the appropriate format for your backend
      };
      
      console.log('Submitting transaction with data:', submissionData);
      await onSubmit(submissionData);
    } catch (error) {
      console.error('Error submitting transaction:', error);
      setErrors(prev => ({
        ...prev,
        form: 'Failed to submit transaction. Please try again.'
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle deletion
  const handleDelete = async () => {
    if (!formData.id || !onDelete) return;
    
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        console.log('Deleting transaction with ID:', formData.id);
        await onDelete(formData.id);
      } catch (error) {
        console.error('Error deleting transaction:', error);
        setErrors(prev => ({
          ...prev,
          form: 'Failed to delete transaction. Please try again.'
        }));
      }
    }
  };

  // Handle cancel
  const handleCancel = () => {
    console.log('Form cancelled');
    if (onCancel) onCancel();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Error message */}
      {errors.form && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg mb-4">
          {errors.form}
        </div>
      )}
      
      {/* Transaction Type */}
      <div>
        <label className="block text-gray-700 text-sm font-bold mb-2">
          Transaction Type
        </label>
        <div className="flex space-x-4">
          <label className="inline-flex items-center">
            <input
              type="radio"
              name="type"
              value="income"
              checked={formData.type === 'income'}
              onChange={handleChange}
              className="form-radio h-4 w-4 text-blue-600"
            />
            <span className="ml-2 text-gray-700">Income</span>
          </label>
          <label className="inline-flex items-center">
            <input
              type="radio"
              name="type"
              value="expense"
              checked={formData.type === 'expense'}
              onChange={handleChange}
              className="form-radio h-4 w-4 text-blue-600"
            />
            <span className="ml-2 text-gray-700">Expense</span>
          </label>
        </div>
      </div>
      
      {/* Date */}
      <div>
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="date">
          Date
        </label>
        <input
          id="date"
          name="date"
          type="date"
          value={formData.date}
          onChange={handleChange}
          className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
            errors.date ? 'border-red-500' : ''
          }`}
          required
        />
        {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
      </div>
      
      {/* Amount and Coin */}
      <div className="flex space-x-4">
        <div className="flex-1">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="amount">
            Amount
          </label>
          <input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={handleChange}
            className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
              errors.amount ? 'border-red-500' : ''
            }`}
            required
          />
          {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
        </div>
        
        <div className="w-1/3">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="coin">
            Coin
          </label>
          <select
            id="coin"
            name="coin"
            value={formData.coin}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
            <option value="USDC">USDC</option>
            <option value="USDT">USDT</option>
            <option value="DAI">DAI</option>
          </select>
        </div>
      </div>
      
      {/* Wallet */}
      <div>
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="wallet">
          Wallet
        </label>
        <select
          id="wallet"
          name="wallet"
          value={formData.wallet}
          onChange={handleChange}
          className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
            errors.wallet ? 'border-red-500' : ''
          }`}
          required
        >
          <option value="">Select a wallet</option>
          {wallets.map(wallet => (
            <option key={wallet} value={wallet}>
              {wallet}
            </option>
          ))}
        </select>
        {errors.wallet && <p className="text-red-500 text-xs mt-1">{errors.wallet}</p>}
      </div>
      
      {/* Category */}
      <div>
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="category">
          Category
        </label>
        <select
          id="category"
          name="category"
          value={formData.category}
          onChange={handleChange}
          className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
            errors.category ? 'border-red-500' : ''
          }`}
          required
        >
          <option value="">Select a category</option>
          {categories.map(category => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
      </div>
      
      {/* Description */}
      <div>
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
          Description
        </label>
        <input
          id="description"
          name="description"
          type="text"
          value={formData.description}
          onChange={handleChange}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
      </div>
      
      {/* Notes */}
      <div>
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="notes">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          rows={3}
        />
      </div>
      
      {/* Form Actions */}
      <div className="flex items-center justify-between pt-4">
        <div>
          {formData.id && onDelete && (
            <button
              type="button"
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Delete
            </button>
          )}
        </div>
        
        <div className="flex space-x-4">
          {onCancel && (
            <button
              type="button"
              onClick={handleCancel}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Cancel
            </button>
          )}
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            {isSubmitting ? 'Saving...' : (formData.id ? 'Update' : 'Save')}
          </button>
        </div>
      </div>
    </form>
  );
} 