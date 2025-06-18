import React from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import { PRODUCTS } from '../../constants/products';
import Header from '../../components/Header';
import ProductCard from '../../components/ProductCard';
import { useCart } from '../../context/CartContext';

export default function OrderScreen() {
  const { addToCart } = useCart();
  
  // Filter products to show only gas products
  const gasProducts = PRODUCTS.filter(product => product.type === 'gas');

  const handleAddToCart = (product, quantity) => {
    addToCart(product, quantity);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <View style={styles.content}>
        <Text style={styles.title}>Select Your Gas Refill</Text>
        <FlatList
          data={gasProducts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ProductCard product={item} onAddToCart={handleAddToCart} />
          )}
          contentContainerStyle={styles.productsList}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  title: {
    color: COLORS.text.white,
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  productsList: {
    paddingBottom: 20,
  },
});