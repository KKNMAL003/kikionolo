export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  type: 'gas' | 'diesel' | 'petrol';
  size?: string;
}

export const PRODUCTS: Product[] = [
  {
    id: 'gas-9kg',
    name: '9 Kg LP Gas Bottle REFILL',
    description: 'Small knee height bottle used for braai\'s, stoves & heaters. REFILL ONLY!',
    price: 344.00,
    image: 'gas-cylinder',
    type: 'gas',
    size: '9kg'
  },
  {
    id: 'gas-19kg',
    name: '19 Kg LP Gas Bottle REFILL',
    description: 'Mid sized bottle used for braai\'s, stoves, heaters and small gas water heaters. REFILL ONLY!',
    price: 727.00,
    image: 'gas-cylinder',
    type: 'gas',
    size: '19kg'
  },
  {
    id: 'gas-48kg',
    name: '48 Kg LP Gas Bottle REFILL',
    description: 'Large commercial sized bottle used for restaurants, large heaters and gas water heaters. REFILL ONLY!',
    price: 1850.00,
    image: 'gas-cylinder',
    type: 'gas',
    size: '48kg'
  },
  {
    id: 'diesel-20l',
    name: 'Diesel 20L Container',
    description: 'High-quality diesel fuel for generators and diesel engines. 20L container.',
    price: 420.00,
    image: 'fuel-container',
    type: 'diesel'
  },
  {
    id: 'petrol-20l',
    name: 'Petrol 20L Container',
    description: 'Premium unleaded petrol for generators and petrol engines. 20L container.',
    price: 450.00,
    image: 'fuel-container',
    type: 'petrol'
  }
];