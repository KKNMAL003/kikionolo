import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import Header from '../../components/Header';
import { WebView } from 'react-native-webview';

export default function ChatScreen() {
  const chatbaseUrl = 'https://www.chatbase.co/chatbot-iframe/SzxvYORICrmmckhOCkvB6';

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <View style={styles.content}>
        <WebView
          source={{ uri: chatbaseUrl }}
          style={styles.webview}
          startInLoadingState={true}
          javaScriptEnabled={true}
          domStorageEnabled={true}
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
  },
  webview: {
    flex: 1,
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
});