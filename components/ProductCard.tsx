import React, { useState } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { Product } from '../constants/products';
import Toast from 'react-native-toast-message';
import { BaseButton } from './base/BaseButton';
import { BaseCard } from './base/BaseCard';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, quantity: number) => void;
}

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const imageSources: Record<string, any> = {
    'gas-cylinder-9kg': require('../assets/images/Gas-Cylinder-9kg.jpg'),
    'gas-cylinder-19kg': require('../assets/images/Gas-Cylinder-19kg.jpg'),
    'gas-cylinder-48kg': require('../assets/images/Gas-Cylinder-48kg.jpg'),
  };

  const productImage = imageSources[product.image];
  const [quantity, setQuantity] = useState(1);

  const increaseQuantity = () => {
    setQuantity((prev) => prev + 1);
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
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
    <BaseCard style={styles.container}>
      <View style={styles.iconContainer}>
        {productImage ? (
          <Image source={productImage} style={{ width: 72, height: 72, resizeMode: 'contain' }} />
        ) : (
          <Ionicons
            name={product.type === 'gas' ? 'flame-outline' : 'water-outline'}
            size={60}
            color={colors.primary}
          />
        )}
      </View>
      <Text style={styles.name}>{product.name}</Text>
      <Text style={styles.description}>{product.description}</Text>
      <Text style={styles.price}>R {product.price.toFixed(2)}</Text>

      <View style={styles.quantityContainer}>
        <BaseButton
          style={styles.quantityButton}
          onPress={decreaseQuantity}
          disabled={quantity <= 1}
        >
          <Ionicons
            name="remove"
            size={20}
            color={quantity <= 1 ? colors.inactive : colors.text.white}
          />
        </BaseButton>

        <Text style={styles.quantityText}>{quantity}</Text>

        <BaseButton style={styles.quantityButton} onPress={increaseQuantity}>
          <Ionicons name="add" size={20} color={colors.text.white} />
        </BaseButton>
      </View>

      <BaseButton onPress={handleAddToCart} style={styles.button}>
        Add to Cart
      </BaseButton>
    </BaseCard>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    textAlign: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    alignSelf: 'center',
  },
  name: {
    color: colors.text.white,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    color: colors.text.gray,
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  price: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    textAlign: 'center',
  },
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    color: colors.text.white,
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 16,
  },
  button: {
    marginTop: 8,
  },
});
