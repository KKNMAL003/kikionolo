import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { Product } from '../constants/products';
import Button from './Button';
import Toast from 'react-native-toast-message';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, quantity: number) => void;
}

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const [quantity, setQuantity] = useState(1);

  const increaseQuantity = () => {
    setQuantity(prev => prev + 1);
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  const handleAddToCart = () => {
    onAddToCart(product, quantity);
    
    // Show toast notification
    Toast.show({
      type: 'success',
      text1: 'Added to Cart',
      text2: `${quantity} x ${product.name} added to your cart.`,
      position: 'bottom',
      visibilityTime: 2000,
    });
    
    // Reset quantity after adding to cart
    setQuantity(1);
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons 
          name={product.type === 'gas' ? 'cube-outline' : 'water-outline'} 
          size={32} 
          color={COLORS.primary} 
        />
      </View>
      <Text style={styles.name}>{product.name}</Text>
      <Text style={styles.description}>{product.description}</Text>
      <Text style={styles.price}>R {product.price.toFixed(2)}</Text>
      
      <View style={styles.quantityContainer}>
        <TouchableOpacity 
          style={styles.quantityButton} 
          onPress={decreaseQuantity}
          disabled={quantity <= 1}
        >
          <Ionicons 
            name="remove" 
            size={20} 
            color={quantity <= 1 ? COLORS.inactive : COLORS.text.white} 
          />
        </TouchableOpacity>
        
        <Text style={styles.quantityText}>{quantity}</Text>
        
        <TouchableOpacity 
          style={styles.quantityButton} 
          onPress={increaseQuantity}
        >
          <Ionicons name="add" size={20} color={COLORS.text.white} />
        </TouchableOpacity>
      </View>
      
      <Button 
        title="Add to Cart" 
        onPress={handleAddToCart} 
        style={styles.button}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  name: {
    color: COLORS.text.white,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    color: COLORS.text.gray,
    fontSize: 14,
    marginBottom: 16,
  },
  price: {
    color: COLORS.primary,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    color: COLORS.text.white,
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 16,
  },
  button: {
    marginTop: 8,
  },
});
