import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Shield, Mail, Eye, Lock, Trash2, Users } from 'lucide-react-native';
import { formatDateFrench } from '@/utils/date';

export default function PrivacyPolicyScreen() {
  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Politique de confidentialité</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Introduction */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Shield size={20} color="#FFD700" />
            <Text style={styles.sectionTitle}>Introduction</Text>
          </View>
          <Text style={styles.paragraph}>
            SØBRE s'engage à protéger votre vie privée et la confidentialité de vos données personnelles, 
            particulièrement sensibles dans le contexte de votre parcours de rétablissement. 
            Cette politique explique comment nous collectons, utilisons et protégeons vos informations.
          </Text>
          <Text style={styles.lastUpdated}>
            Dernière mise à jour : {formatDateFrench(new Date())}
          </Text>
        </View>

        {/* Données collectées */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Eye size={20} color="#FFD700" />
            <Text style={styles.sectionTitle}>Données que nous collectons</Text>
          </View>
          
          <Text style={styles.subsectionTitle}>Informations de compte</Text>
          <Text style={styles.paragraph}>
            • Adresse email et mot de passe (chiffrés){'\n'}
            • Nom complet{'\n'}
            • Âge{'\n'}
            • Réponses au questionnaire d'évaluation initial
          </Text>

          <Text style={styles.subsectionTitle}>Données de parcours thérapeutique</Text>
          <Text style={styles.paragraph}>
            • Journal personnel (humeurs, pensées, réflexions){'\n'}
            • Déclencheurs identifiés et stratégies d'évitement{'\n'}
            • Victoires personnelles et défis rencontrés{'\n'}
            • Historique des rechutes (dates, contexte, apprentissages){'\n'}
            • Conversations avec Clario (assistant IA thérapeutique){'\n'}
            • Raisons personnelles de votre changement{'\n'}
            • Objectifs de vie et aspirations{'\n'}
            • Notes de réflexion sur votre progression
          </Text>

          <Text style={styles.subsectionTitle}>Données d'utilisation</Text>
          <Text style={styles.paragraph}>
            • Statistiques de sobriété (jours, séries, progression){'\n'}
            • Missions quotidiennes accomplies{'\n'}
            • Paliers de progression atteints{'\n'}
            • Paramètres de l'application
          </Text>
        </View>

        {/* Comment nous utilisons vos données */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Users size={20} color="#FFD700" />
            <Text style={styles.sectionTitle}>Comment nous utilisons vos données</Text>
          </View>
          <Text style={styles.paragraph}>
            Vos données sont utilisées exclusivement pour :
          </Text>
          <Text style={styles.paragraph}>
            • <Text style={styles.bold}>Fournir un accompagnement thérapeutique personnalisé</Text> via Clario et les outils de l'application{'\n'}
            • <Text style={styles.bold}>Suivre votre progression</Text> et vous encourager dans votre parcours{'\n'}
            • <Text style={styles.bold}>Sauvegarder votre historique</Text> pour une continuité de suivi{'\n'}
            • <Text style={styles.bold}>Synchroniser vos données</Text> entre vos appareils{'\n'}
            • <Text style={styles.bold}>Vous envoyer des notifications motivationnelles</Text> (si activées)
          </Text>
          <Text style={styles.importantNote}>
            ⚠️ Nous n'utilisons JAMAIS vos données à des fins commerciales, publicitaires ou de marketing.
          </Text>
        </View>

        {/* Stockage et sécurité */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Lock size={20} color="#FFD700" />
            <Text style={styles.sectionTitle}>Stockage et sécurité</Text>
          </View>
          
          <Text style={styles.subsectionTitle}>Où sont stockées vos données</Text>
          <Text style={styles.paragraph}>
            • <Text style={styles.bold}>Localement</Text> : Sur votre appareil (chiffrement local){'\n'}
            • <Text style={styles.bold}>Cloud sécurisé</Text> : Firebase (Google Cloud, conformité RGPD){'\n'}
            • <Text style={styles.bold}>Localisation</Text> : Serveurs européens pour les utilisateurs EU
          </Text>

          <Text style={styles.subsectionTitle}>Mesures de sécurité</Text>
          <Text style={styles.paragraph}>
            • Chiffrement de bout en bout pour toutes les données sensibles{'\n'}
            • Authentification sécurisée via Firebase{'\n'}
            • Accès limité aux données (aucun employé ne peut lire vos journaux){'\n'}
            • Sauvegarde automatique et sécurisée{'\n'}
            • Protection contre les accès non autorisés
          </Text>
        </View>

        {/* Partage des données */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Users size={20} color="#FFD700" />
            <Text style={styles.sectionTitle}>Partage des données</Text>
          </View>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>SØBRE ne partage JAMAIS vos données personnelles</Text> avec des tiers à des fins commerciales, publicitaires ou de marketing.
          </Text>
          <Text style={styles.paragraph}>
            Exceptions limitées (uniquement si légalement requis) :
          </Text>
          <Text style={styles.paragraph}>
            • Demandes légales des autorités compétentes{'\n'}
            • Protection contre la fraude ou abus{'\n'}
            • Situations d'urgence mettant en jeu la sécurité
          </Text>
        </View>

        {/* Permissions de l'appareil */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Eye size={20} color="#FFD700" />
            <Text style={styles.sectionTitle}>Permissions demandées</Text>
          </View>
          <Text style={styles.paragraph}>
            • <Text style={styles.bold}>Notifications</Text> : Pour vous encourager et vous rappeler vos objectifs{'\n'}
            • <Text style={styles.bold}>Caméra</Text> : Utilisée uniquement en mode urgence pour vous aider à rester ancré dans le moment présent{'\n'}
            • <Text style={styles.bold}>Internet</Text> : Nécessaire pour Clario (IA thérapeutique) et la synchronisation{'\n'}
            • <Text style={styles.bold}>Stockage</Text> : Pour sauvegarder vos données de progression localement
          </Text>
          <Text style={styles.importantNote}>
            ⚠️ Aucune photo ou vidéo n'est enregistrée ou transmise. La caméra est utilisée uniquement en temps réel.
          </Text>
        </View>

        {/* Vos droits */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Trash2 size={20} color="#FFD700" />
            <Text style={styles.sectionTitle}>Vos droits (RGPD)</Text>
          </View>
          <Text style={styles.paragraph}>
            Vous avez le droit de :
          </Text>
          <Text style={styles.paragraph}>
            • <Text style={styles.bold}>Accéder</Text> à toutes vos données personnelles{'\n'}
            • <Text style={styles.bold}>Rectifier</Text> ou corriger vos informations{'\n'}
            • <Text style={styles.bold}>Supprimer</Text> votre compte et toutes vos données{'\n'}
            • <Text style={styles.bold}>Exporter</Text> vos données dans un format lisible{'\n'}
            • <Text style={styles.bold}>Limiter</Text> le traitement de vos données{'\n'}
            • <Text style={styles.bold}>Vous opposer</Text> au traitement pour des motifs légitimes
          </Text>
        </View>

        {/* Suppression des données */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Trash2 size={20} color="#FFD700" />
            <Text style={styles.sectionTitle}>Suppression de compte</Text>
          </View>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>Actuellement</Text> : Contactez-nous à sobre.appli@gmail.com pour supprimer votre compte et toutes vos données.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>Prochainement</Text> : Suppression directe depuis l'application (fonctionnalité en développement).
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>Délai</Text> : Suppression effective sous 30 jours maximum.
          </Text>
          <Text style={styles.importantNote}>
            ⚠️ La suppression est définitive et irréversible. Toutes vos données de progression seront perdues.
          </Text>
        </View>

        {/* Conservation des données */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Lock size={20} color="#FFD700" />
            <Text style={styles.sectionTitle}>Conservation des données</Text>
          </View>
          <Text style={styles.paragraph}>
            • <Text style={styles.bold}>Compte actif</Text> : Conservation tant que vous utilisez l'application{'\n'}
            • <Text style={styles.bold}>Compte inactif</Text> : Suppression automatique après 3 ans d'inactivité{'\n'}
            • <Text style={styles.bold}>Après suppression</Text> : Effacement complet sous 30 jours{'\n'}
            • <Text style={styles.bold}>Données anonymisées</Text> : Statistiques générales (sans identification) conservées pour améliorer l'app
          </Text>
        </View>

        {/* Contact */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Mail size={20} color="#FFD700" />
            <Text style={styles.sectionTitle}>Nous contacter</Text>
          </View>
          <Text style={styles.paragraph}>
            Pour toute question concernant cette politique de confidentialité ou vos données personnelles :
          </Text>
          <View style={styles.contactInfo}>
            <Text style={styles.contactText}>
              📧 Email : sobre.appli@gmail.com{'\n'}
              🏢 Responsable : Équipe SØBRE{'\n'}
              ⏱️ Délai de réponse : 48h maximum
            </Text>
          </View>
        </View>

        {/* Modifications */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Shield size={20} color="#FFD700" />
            <Text style={styles.sectionTitle}>Modifications de cette politique</Text>
          </View>
          <Text style={styles.paragraph}>
            Nous pouvons mettre à jour cette politique pour refléter les changements dans nos pratiques ou pour des raisons légales. 
            Vous serez notifié de tout changement significatif via l'application ou par email.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>Date d'entrée en vigueur</Text> : {formatDateFrench(new Date())}
          </Text>
        </View>

        {/* Message de confiance */}
        <View style={styles.trustSection}>
          <Text style={styles.trustTitle}>Notre engagement envers vous</Text>
          <Text style={styles.trustText}>
            SØBRE comprend la nature sensible de votre parcours. Nous nous engageons à traiter vos données 
            avec le plus grand respect, la plus haute sécurité et la transparence totale. 
            Votre confiance est précieuse et nous la protégeons.
          </Text>
        </View>
      </ScrollView>
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
  backButton: {
    padding: 8,
    width: 40,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  section: {
    marginBottom: 32,
    paddingTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  subsectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFD700',
    marginBottom: 8,
    marginTop: 16,
  },
  paragraph: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#F5F5F5',
    lineHeight: 24,
    marginBottom: 12,
  },
  bold: {
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  importantNote: {
    backgroundColor: '#2A1A1A',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  lastUpdated: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#A3A3A3',
    fontStyle: 'italic',
    marginTop: 16,
  },
  contactInfo: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  contactText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#F5F5F5',
    lineHeight: 24,
  },
  trustSection: {
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  trustTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#FFD700',
    marginBottom: 12,
    textAlign: 'center',
  },
  trustText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#F5F5F5',
    lineHeight: 24,
    textAlign: 'center',
  },
});
