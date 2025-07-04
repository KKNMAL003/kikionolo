import React, { useState, memo } from 'react';
import { Image, View, ActivityIndicator, StyleSheet, ImageProps } from 'react-native';
import { COLORS } from '../constants/colors';

interface LazyImageProps extends Omit<ImageProps, 'source'> {
  source: any;
  placeholder?: React.ReactNode;
  fallback?: React.ReactNode;
  width?: number;
  height?: number;
}

const LazyImage = memo<LazyImageProps>(({ 
  source, 
  placeholder, 
  fallback, 
  width = 100, 
  height = 100, 
  style, 
  ...props 
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleLoadStart = () => {
    setLoading(true);
    setError(false);
  };

  const handleLoadEnd = () => {
    setLoading(false);
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
  };

  if (error && fallback) {
    return <>{fallback}</>;
  }

  return (
    <View style={[styles.container, { width, height }, style]}>
      <Image
        source={source}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        style={[styles.image, { width, height }]}
        {...props}
      />
      
      {loading && (
        <View style={styles.loadingContainer}>
          {placeholder || (
            <ActivityIndicator 
              size="small" 
              color={COLORS.primary} 
            />
          )}
        </View>
      )}
    </View>
  );
});

LazyImage.displayName = 'LazyImage';

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    backgroundColor: COLORS.card,
    borderRadius: 8,
    overflow: 'hidden',
  },
  image: {
    resizeMode: 'cover',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.card,
  },
});

export default LazyImage;
