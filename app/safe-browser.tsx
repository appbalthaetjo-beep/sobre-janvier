import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, ArrowRight, RotateCcw, Chrome as Home, Shield, Globe } from 'lucide-react-native';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

export default function SafeBrowserScreen() {
  const [url, setUrl] = useState('https://www.google.com');
  const [currentUrl, setCurrentUrl] = useState('https://www.google.com');
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [blockedDomains, setBlockedDomains] = useState<string[]>([]);
  const [blockedAttempts, setBlockedAttempts] = useState(0);
  const [showBlockedPage, setShowBlockedPage] = useState(false);
  const [blockedUrl, setBlockedUrl] = useState('');
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    loadBlockedDomains();
    loadBlockedAttempts();
  }, []);

  const loadBlockedDomains = async () => {
    try {
      const domainsData = await AsyncStorage.getItem('blockedDomains');
      if (domainsData) {
        setBlockedDomains(JSON.parse(domainsData));
      }
    } catch (error) {
      console.error('Error loading blocked domains:', error);
    }
  };

  const loadBlockedAttempts = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const attemptsData = await AsyncStorage.getItem(`blockedAttempts_${today}`);
      if (attemptsData) {
        setBlockedAttempts(parseInt(attemptsData));
      }
    } catch (error) {
      console.error('Error loading blocked attempts:', error);
    }
  };

  const saveBlockedAttempts = async (count: number) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      await AsyncStorage.setItem(`blockedAttempts_${today}`, count.toString());
    } catch (error) {
      console.error('Error saving blocked attempts:', error);
    }
  };

  const extractDomain = (urlString: string) => {
    try {
      let cleanUrl = urlString.trim();
      if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
        cleanUrl = 'https://' + cleanUrl;
      }
      const urlObj = new URL(cleanUrl);
      return urlObj.hostname.replace('www.', '').toLowerCase();
    } catch (error) {
      return urlString.toLowerCase();
    }
  };

  const isUrlBlocked = (urlString: string) => {
    const domain = extractDomain(urlString);
    return blockedDomains.some(blockedDomain => 
      domain === blockedDomain.toLowerCase() || 
      domain.endsWith('.' + blockedDomain.toLowerCase())
    );
  };

  const handleNavigationRequest = (request: any) => {
    const requestUrl = request.url;
    
    if (isUrlBlocked(requestUrl)) {
      setBlockedUrl(requestUrl);
      setShowBlockedPage(true);
      
      // Incrémenter et sauvegarder les tentatives bloquées
      const newCount = blockedAttempts + 1;
      setBlockedAttempts(newCount);
      saveBlockedAttempts(newCount);
      
      return false; // Bloquer la navigation
    }
    
    setShowBlockedPage(false);
    setCurrentUrl(requestUrl);
    return true; // Permettre la navigation
  };

  const handleUrlSubmit = () => {
    let targetUrl = url.trim();
    
    if (!targetUrl) return;
    
    // Ajouter https:// si pas de protocole
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl;
    }
    
    if (isUrlBlocked(targetUrl)) {
      setBlockedUrl(targetUrl);
      setShowBlockedPage(true);
      
      // Incrémenter les tentatives bloquées
      const newCount = blockedAttempts + 1;
      setBlockedAttempts(newCount);
      saveBlockedAttempts(newCount);
      return;
    }
    
    setShowBlockedPage(false);
    setCurrentUrl(targetUrl);
    
    // Naviguer dans la WebView
    if (webViewRef.current) {
      webViewRef.current.reload();
    }
  };

  const goBack = () => {
    if (webViewRef.current && canGoBack) {
      webViewRef.current.goBack();
    }
  };

  const goForward = () => {
    if (webViewRef.current && canGoForward) {
      webViewRef.current.goForward();
    }
  };

  const refresh = () => {
    if (webViewRef.current) {
      webViewRef.current.reload();
    }
  };

  const goHome = () => {
    setUrl('https://www.google.com');
    setCurrentUrl('https://www.google.com');
    setShowBlockedPage(false);
    if (webViewRef.current) {
      webViewRef.current.reload();
    }
  };

  const handleReturnToNavigation = () => {
    setShowBlockedPage(false);
    setUrl('https://www.google.com');
    setCurrentUrl('https://www.google.com');
    if (webViewRef.current) {
      webViewRef.current.reload();
    }
  };

  if (showBlockedPage) {
    return (
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.title}>Navigateur Sécurisé</Text>
          <View style={styles.spacer} />
        </View>

        {/* Page de blocage */}
        <View style={styles.blockedContainer}>
          <View style={styles.blockedContent}>
            <Shield size={80} color="#DC2626" />
            
            <Text style={styles.blockedTitle}>⚠️ Site bloqué par SØBRE</Text>
            
            <Text style={styles.blockedMessage}>
              Ce site fait partie de votre liste de blocage et a été bloqué pour votre protection.
            </Text>
            
            <View style={styles.blockedUrl}>
              <Text style={styles.blockedUrlText}>{extractDomain(blockedUrl)}</Text>
            </View>
            
            <View style={styles.attemptsContainer}>
              <Text style={styles.attemptsText}>
                🛡️ {blockedAttempts} tentative{blockedAttempts > 1 ? 's' : ''} bloquée{blockedAttempts > 1 ? 's' : ''} aujourd'hui
              </Text>
            </View>
            
            <TouchableOpacity
              style={styles.returnButton}
              onPress={handleReturnToNavigation}
            >
              <Text style={styles.returnButtonText}>Retour à la navigation</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Navigateur Sécurisé</Text>
        <View style={styles.spacer} />
      </View>

      {/* Barre d'adresse */}
      <View style={styles.addressBar}>
        <Globe size={20} color="#A3A3A3" />
        <TextInput
          style={styles.urlInput}
          placeholder="Entrez une URL..."
          placeholderTextColor="#666666"
          value={url}
          onChangeText={setUrl}
          onSubmitEditing={handleUrlSubmit}
          keyboardType="url"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="go"
        />
        <TouchableOpacity onPress={handleUrlSubmit} style={styles.goButton}>
          <Text style={styles.goButtonText}>Aller</Text>
        </TouchableOpacity>
      </View>

      {/* WebView */}
      <View style={styles.webViewContainer}>
        <WebView
          ref={webViewRef}
          source={{ uri: currentUrl }}
          style={styles.webView}
          onNavigationStateChange={(navState) => {
            setCanGoBack(navState.canGoBack);
            setCanGoForward(navState.canGoForward);
            setUrl(navState.url);
          }}
          onShouldStartLoadWithRequest={handleNavigationRequest}
          startInLoadingState
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Chargement sécurisé...</Text>
            </View>
          )}
        />
      </View>

      {/* Barre de navigation */}
      <View style={styles.navigationBar}>
        <TouchableOpacity
          onPress={goBack}
          style={[styles.navButton, !canGoBack && styles.navButtonDisabled]}
          disabled={!canGoBack}
        >
          <ArrowLeft size={24} color={canGoBack ? "#FFFFFF" : "#666666"} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={goForward}
          style={[styles.navButton, !canGoForward && styles.navButtonDisabled]}
          disabled={!canGoForward}
        >
          <ArrowRight size={24} color={canGoForward ? "#FFFFFF" : "#666666"} />
        </TouchableOpacity>

        <TouchableOpacity onPress={refresh} style={styles.navButton}>
          <RotateCcw size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity onPress={goHome} style={styles.navButton}>
          <Home size={24} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Indicateur de protection */}
        <View style={styles.protectionIndicator}>
          <Shield size={16} color="#10B981" />
          <Text style={styles.protectionText}>Protégé</Text>
        </View>
      </View>

      {/* Statistiques de blocage */}
      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>
          🛡️ {blockedAttempts} site{blockedAttempts > 1 ? 's' : ''} bloqué{blockedAttempts > 1 ? 's' : ''} aujourd'hui
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  headerButton: {
    padding: 8,
    width: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  spacer: {
    width: 40,
  },
  addressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  urlInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    marginLeft: 12,
  },
  goButton: {
    backgroundColor: '#FFD700',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginLeft: 12,
  },
  goButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#000000',
  },
  webViewContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  webView: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#666666',
  },
  navigationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#333333',
    gap: 16,
  },
  navButton: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  navButtonDisabled: {
    backgroundColor: '#1A1A1A',
    opacity: 0.5,
  },
  protectionIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A2A1A',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginLeft: 'auto',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  protectionText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#10B981',
    marginLeft: 4,
  },
  statsContainer: {
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
  },
  statsText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#A3A3A3',
  },
  
  // Styles pour la page de blocage
  blockedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#000000',
  },
  blockedContent: {
    backgroundColor: '#1A1A1A',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#DC2626',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    maxWidth: 350,
  },
  blockedTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#DC2626',
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  blockedMessage: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#F5F5F5',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  blockedUrl: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#333333',
  },
  blockedUrlText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#A3A3A3',
    textAlign: 'center',
  },
  attemptsContainer: {
    backgroundColor: '#2A1A1A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#DC2626',
  },
  attemptsText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#DC2626',
    textAlign: 'center',
  },
  returnButton: {
    backgroundColor: '#FFD700',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  returnButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#000000',
  },
});