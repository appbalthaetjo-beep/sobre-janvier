import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, FileText, TriangleAlert as AlertTriangle, Users, Shield, Crown, Heart } from 'lucide-react-native';
import { formatDateFrench } from '@/utils/date';

export default function TermsOfServiceScreen() {
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
        <Text style={styles.headerTitle}>Conditions d'utilisation</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Introduction */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FileText size={20} color="#FFD700" />
            <Text style={styles.sectionTitle}>Conditions générales d'utilisation</Text>
          </View>
          <Text style={styles.paragraph}>
            Bienvenue dans SØBRE, votre application d'accompagnement vers la liberté. 
            En utilisant SØBRE, vous acceptez les présentes conditions d'utilisation qui 
            régissent votre accès et l'utilisation de nos services de soutien thérapeutique.
          </Text>
          <Text style={styles.lastUpdated}>
            <Text style={styles.bold}>Date d'entrée en vigueur :</Text> {formatDateFrench(new Date())}
          </Text>
          <Text style={styles.lastUpdated}>
            <Text style={styles.bold}>Dernière mise à jour :</Text> {formatDateFrench(new Date())}
          </Text>
        </View>

        {/* Qui peut utiliser SØBRE */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Users size={20} color="#FFD700" />
            <Text style={styles.sectionTitle}>Qui peut utiliser SØBRE ?</Text>
          </View>
          
          <Text style={styles.subsectionTitle}>Âge minimum</Text>
          <Text style={styles.paragraph}>
            SØBRE est accessible aux personnes âgées de <Text style={styles.bold}>12 ans minimum</Text>. 
            Pour les utilisateurs mineurs (12-18 ans), nous recommandons vivement :
          </Text>
          <Text style={styles.paragraph}>
            • L'accompagnement et la supervision d'un parent ou tuteur légal{'\n'}
            • Une discussion ouverte avec un adulte de confiance{'\n'}
            • L'implication des parents dans le parcours de rétablissement{'\n'}
            • Une consultation médicale si nécessaire
          </Text>

          <Text style={styles.subsectionTitle}>Conditions d'éligibilité</Text>
          <Text style={styles.paragraph}>
            Pour utiliser SØBRE, vous devez :
          </Text>
          <Text style={styles.paragraph}>
            • Être âgé d'au moins 12 ans{'\n'}
            • Fournir des informations exactes lors de l'inscription{'\n'}
            • Utiliser l'application de manière responsable et constructive{'\n'}
            • Respecter les autres membres de la communauté{'\n'}
            • Accepter ces conditions d'utilisation
          </Text>
        </View>

        {/* Nature de notre service */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Crown size={20} color="#FFD700" />
            <Text style={styles.sectionTitle}>Nature de notre service</Text>
          </View>
          
          <Text style={styles.subsectionTitle}>Ce que SØBRE propose</Text>
          <Text style={styles.paragraph}>
            SØBRE est une application d'accompagnement et de soutien qui propose :
          </Text>
          <Text style={styles.paragraph}>
            • <Text style={styles.bold}>Suivi de progression</Text> : compteur de sobriété, statistiques personnelles{'\n'}
            • <Text style={styles.bold}>Assistant IA Clario</Text> : soutien thérapeutique 24h/7j{'\n'}
            • <Text style={styles.bold}>Outils de bien-être</Text> : méditation, exercices de respiration{'\n'}
            • <Text style={styles.bold}>Contenu éducatif</Text> : 25 leçons structurées sur 5 modules{'\n'}
            • <Text style={styles.bold}>Communauté anonyme</Text> : partage et soutien mutuel{'\n'}
            • <Text style={styles.bold}>Mode urgence</Text> : outils de prévention des rechutes{'\n'}
            • <Text style={styles.bold}>Protection technique</Text> : blocage de sites, navigateur sécurisé
          </Text>

          <Text style={styles.subsectionTitle}>Ce que SØBRE n'est PAS</Text>
          <Text style={styles.importantNote}>
            ⚠️ SØBRE n'est pas un dispositif médical et ne remplace en aucun cas :
          </Text>
          <Text style={styles.paragraph}>
            • Une consultation médicale ou psychologique professionnelle{'\n'}
            • Un traitement thérapeutique encadré par un professionnel{'\n'}
            • Une prise en charge psychiatrique si nécessaire{'\n'}
            • L'avis d'un sexologue ou addictologue{'\n'}
            • Un suivi médical pour troubles associés
          </Text>
        </View>

        {/* Vos responsabilités */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Users size={20} color="#FFD700" />
            <Text style={styles.sectionTitle}>Vos responsabilités d'utilisateur</Text>
          </View>
          
          <Text style={styles.subsectionTitle}>Utilisation appropriée</Text>
          <Text style={styles.paragraph}>
            En utilisant SØBRE, vous vous engagez à :
          </Text>
          <Text style={styles.paragraph}>
            • <Text style={styles.bold}>Être honnête</Text> dans vos saisies (journal, progression, rechutes){'\n'}
            • <Text style={styles.bold}>Respecter la communauté</Text> : pas de contenu inapproprié ou offensant{'\n'}
            • <Text style={styles.bold}>Protéger votre compte</Text> : mot de passe sécurisé, pas de partage{'\n'}
            • <Text style={styles.bold}>Usage personnel uniquement</Text> : ne pas créer plusieurs comptes{'\n'}
            • <Text style={styles.bold}>Signaler les problèmes</Text> : bugs, contenu inapproprié dans la communauté
          </Text>

          <Text style={styles.subsectionTitle}>Comportements interdits</Text>
          <Text style={styles.paragraph}>
            Il est strictement interdit de :
          </Text>
          <Text style={styles.paragraph}>
            • Partager du contenu explicite ou pornographique{'\n'}
            • Harceler, intimider ou offenser d'autres utilisateurs{'\n'}
            • Contourner les systèmes de sécurité de l'application{'\n'}
            • Utiliser l'app pour des activités illégales{'\n'}
            • Copier ou redistribuer le contenu de SØBRE{'\n'}
            • Créer de faux comptes ou usurper une identité
          </Text>
        </View>

        {/* Disclaimers médicaux et d'urgence */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <AlertTriangle size={20} color="#FFD700" />
            <Text style={styles.sectionTitle}>Avertissements médicaux</Text>
          </View>
          
          <Text style={styles.subsectionTitle}>Limitation thérapeutique</Text>
          <Text style={styles.importantNote}>
            ⚠️ IMPORTANT : SØBRE est un outil de soutien, pas un traitement médical.
          </Text>
          <Text style={styles.paragraph}>
            Pour des problèmes graves d'addiction, nous recommandons fortement :
          </Text>
          <Text style={styles.paragraph}>
            • Consultation d'un addictologue ou psychologue spécialisé{'\n'}
            • Thérapie cognitivo-comportementale (TCC){'\n'}
            • Groupes de soutien locaux (Narcotiques Anonymes, etc.){'\n'}
            • Suivi médical si troubles associés (dépression, anxiété)
          </Text>

          <Text style={styles.subsectionTitle}>Situations d'urgence</Text>
          <Text style={styles.paragraph}>
            Si vous ressentez des <Text style={styles.bold}>pensées suicidaires</Text> ou êtes en <Text style={styles.bold}>détresse psychologique grave</Text>, 
            contactez immédiatement les services d'urgence :
          </Text>
          <View style={styles.emergencyContainer}>
            <Text style={styles.emergencyText}>
              🚨 <Text style={styles.bold}>Numéro d'urgence :</Text> 15 (SAMU){'\n'}
              📞 <Text style={styles.bold}>SOS Amitié :</Text> 09 72 39 40 50{'\n'}
              🆘 <Text style={styles.bold}>Suicide Écoute :</Text> 01 45 39 40 00{'\n'}
              🩺 <Text style={styles.bold}>Ligne addiction :</Text> 0800 23 13 13 (gratuit)
            </Text>
          </View>
        </View>

        {/* Propriété intellectuelle */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Shield size={20} color="#FFD700" />
            <Text style={styles.sectionTitle}>Propriété intellectuelle</Text>
          </View>
          <Text style={styles.paragraph}>
            Tous les éléments de SØBRE sont protégés par les droits d'auteur :
          </Text>
          <Text style={styles.paragraph}>
            • <Text style={styles.bold}>Contenus originaux</Text> : leçons, exercices, méthodologies{'\n'}
            • <Text style={styles.bold}>Interface utilisateur</Text> : design, animations, cristaux de progression{'\n'}
            • <Text style={styles.bold}>Assistant Clario</Text> : intelligence artificielle et réponses{'\n'}
            • <Text style={styles.bold}>Marque SØBRE</Text> : logo, nom, identité visuelle
          </Text>
          
          <Text style={styles.subsectionTitle}>Utilisation autorisée</Text>
          <Text style={styles.paragraph}>
            Vous pouvez uniquement :
          </Text>
          <Text style={styles.paragraph}>
            • Utiliser l'application pour votre usage personnel{'\n'}
            • Partager votre expérience de manière générale (témoignages){'\n'}
            • Recommander SØBRE à d'autres personnes
          </Text>

          <Text style={styles.subsectionTitle}>Utilisation interdite</Text>
          <Text style={styles.paragraph}>
            Il est strictement interdit de :
          </Text>
          <Text style={styles.paragraph}>
            • Copier, reproduire ou distribuer nos contenus{'\n'}
            • Créer des applications similaires basées sur nos méthodes{'\n'}
            • Utiliser notre marque ou logo sans autorisation écrite{'\n'}
            • Désassembler, décompiler ou analyser le code source{'\n'}
            • Commercialiser nos contenus sous quelque forme que ce soit
          </Text>
        </View>

        {/* Disponibilité du service */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Crown size={20} color="#FFD700" />
            <Text style={styles.sectionTitle}>Disponibilité et continuité</Text>
          </View>
          
          <Text style={styles.subsectionTitle}>Engagement de service</Text>
          <Text style={styles.paragraph}>
            SØBRE s'efforce de maintenir un service disponible 24h/7j, mais ne peut garantir :
          </Text>
          <Text style={styles.paragraph}>
            • Une disponibilité ininterrompue (maintenance, mises à jour){'\n'}
            • L'absence de bugs ou dysfonctionnements{'\n'}
            • La conservation éternelle de vos données{'\n'}
            • La stabilité de toutes les fonctionnalités
          </Text>

          <Text style={styles.subsectionTitle}>Mises à jour</Text>
          <Text style={styles.paragraph}>
            SØBRE peut :
          </Text>
          <Text style={styles.paragraph}>
            • Ajouter de nouvelles fonctionnalités{'\n'}
            • Modifier l'interface utilisateur{'\n'}
            • Corriger des bugs et améliorer les performances{'\n'}
            • Suspendre temporairement certaines fonctions pour maintenance
          </Text>
        </View>

        {/* Limitation de responsabilité */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <AlertTriangle size={20} color="#FFD700" />
            <Text style={styles.sectionTitle}>Limitation de responsabilité</Text>
          </View>
          
          <Text style={styles.subsectionTitle}>Résultats non garantis</Text>
          <Text style={styles.importantNote}>
            ⚠️ SØBRE ne peut garantir le succès de votre parcours de rétablissement.
          </Text>
          <Text style={styles.paragraph}>
            Les résultats dépendent de nombreux facteurs :
          </Text>
          <Text style={styles.paragraph}>
            • Votre engagement personnel et votre motivation{'\n'}
            • La sévérité de votre addiction{'\n'}
            • Votre environnement social et familial{'\n'}
            • D'éventuels troubles psychologiques associés{'\n'}
            • Votre assiduité dans l'utilisation des outils proposés
          </Text>

          <Text style={styles.subsectionTitle}>Exclusion de responsabilité</Text>
          <Text style={styles.paragraph}>
            SØBRE ne peut être tenu responsable :
          </Text>
          <Text style={styles.paragraph}>
            • Des rechutes ou échecs dans votre parcours{'\n'}
            • Des conseils inadéquats fournis par l'IA Clario{'\n'}
            • Des interactions négatives dans la communauté{'\n'}
            • De la perte de données due à des problèmes techniques{'\n'}
            • Des dommages indirects liés à l'utilisation de l'application{'\n'}
            • Des interruptions de service ou dysfonctionnements
          </Text>
        </View>

        {/* Communauté et modération */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Users size={20} color="#FFD700" />
            <Text style={styles.sectionTitle}>Communauté et modération</Text>
          </View>
          
          <Text style={styles.subsectionTitle}>Règles de la communauté</Text>
          <Text style={styles.paragraph}>
            La communauté SØBRE est un espace de soutien bienveillant. Il est obligatoire de :
          </Text>
          <Text style={styles.paragraph}>
            • <Text style={styles.bold}>Respecter chaque membre</Text> et son parcours unique{'\n'}
            • <Text style={styles.bold}>Encourager positivement</Text> sans jugement{'\n'}
            • <Text style={styles.bold}>Partager avec bienveillance</Text> vos expériences{'\n'}
            • <Text style={styles.bold}>Maintenir l'anonymat</Text> et la confidentialité{'\n'}
            • <Text style={styles.bold}>Signaler les comportements inappropriés</Text>
          </Text>

          <Text style={styles.subsectionTitle}>Modération</Text>
          <Text style={styles.paragraph}>
            SØBRE se réserve le droit de :
          </Text>
          <Text style={styles.paragraph}>
            • Supprimer du contenu inapproprié sans préavis{'\n'}
            • Suspendre ou bannir des comptes violant les règles{'\n'}
            • Modérer les discussions de la communauté{'\n'}
            • Protéger la sécurité et le bien-être de tous les utilisateurs
          </Text>
        </View>

        {/* Données et confidentialité */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Shield size={20} color="#FFD700" />
            <Text style={styles.sectionTitle}>Protection de vos données</Text>
          </View>
          <Text style={styles.paragraph}>
            Vos données personnelles et de parcours thérapeutique sont <Text style={styles.bold}>strictement confidentielles</Text>.
            SØBRE s'engage à :
          </Text>
          <Text style={styles.paragraph}>
            • <Text style={styles.bold}>Ne jamais vendre</Text> vos données à des tiers{'\n'}
            • <Text style={styles.bold}>Ne jamais utiliser</Text> vos informations à des fins publicitaires{'\n'}
            • <Text style={styles.bold}>Chiffrer et sécuriser</Text> toutes vos données sensibles{'\n'}
            • <Text style={styles.bold}>Respecter votre vie privée</Text> absolument{'\n'}
            • <Text style={styles.bold}>Vous permettre de supprimer</Text> votre compte à tout moment
          </Text>
          <Text style={styles.paragraph}>
            Pour plus de détails, consultez notre <Text style={styles.bold}>Politique de Confidentialité</Text> 
            accessible dans les Réglages.
          </Text>
        </View>

        {/* Suspension et résiliation */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <AlertTriangle size={20} color="#FFD700" />
            <Text style={styles.sectionTitle}>Suspension et résiliation</Text>
          </View>
          
          <Text style={styles.subsectionTitle}>Résiliation par l'utilisateur</Text>
          <Text style={styles.paragraph}>
            Vous pouvez arrêter d'utiliser SØBRE à tout moment en :
          </Text>
          <Text style={styles.paragraph}>
            • Supprimant l'application de votre appareil{'\n'}
            • Demandant la suppression de votre compte via sobre.appli@gmail.com{'\n'}
            • Cessant simplement d'utiliser le service
          </Text>

          <Text style={styles.subsectionTitle}>Suspension par SØBRE</Text>
          <Text style={styles.paragraph}>
            SØBRE peut suspendre votre compte en cas de :
          </Text>
          <Text style={styles.paragraph}>
            • Violation grave des règles de la communauté{'\n'}
            • Utilisation abusive ou frauduleuse du service{'\n'}
            • Comportement nuisant à d'autres utilisateurs{'\n'}
            • Non-respect répété de ces conditions
          </Text>
          <Text style={styles.paragraph}>
            En cas de suspension, vous serez notifié et pourrez faire appel à sobre.appli@gmail.com.
          </Text>
        </View>

        {/* Modifications des conditions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FileText size={20} color="#FFD700" />
            <Text style={styles.sectionTitle}>Évolution de ces conditions</Text>
          </View>
          <Text style={styles.paragraph}>
            SØBRE peut modifier ces conditions d'utilisation pour :
          </Text>
          <Text style={styles.paragraph}>
            • Améliorer la clarté et la compréhension{'\n'}
            • S'adapter aux évolutions légales{'\n'}
            • Intégrer de nouvelles fonctionnalités{'\n'}
            • Renforcer la protection des utilisateurs
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>Notification :</Text> Les changements importants vous seront communiqués 
            via l'application ou par email au moins 30 jours avant leur entrée en vigueur.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>Acceptation :</Text> L'utilisation continue de l'application après modification 
            vaut acceptation des nouvelles conditions.
          </Text>
        </View>

        {/* Droit applicable */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Shield size={20} color="#FFD700" />
            <Text style={styles.sectionTitle}>Droit applicable et juridiction</Text>
          </View>
          <Text style={styles.paragraph}>
            Ces conditions sont régies par le <Text style={styles.bold}>droit français</Text>.
          </Text>
          <Text style={styles.paragraph}>
            En cas de litige, les <Text style={styles.bold}>tribunaux français</Text> seront compétents, 
            mais nous privilégions toujours la résolution amiable des différends.
          </Text>
          <Text style={styles.paragraph}>
            Pour toute réclamation ou question juridique, contactez-nous d'abord à : sobre.appli@gmail.com
          </Text>
        </View>

        {/* Contact et support */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Heart size={20} color="#FFD700" />
            <Text style={styles.sectionTitle}>Contact et support</Text>
          </View>
          <Text style={styles.paragraph}>
            L'équipe SØBRE est à votre écoute pour toute question concernant :
          </Text>
          <Text style={styles.paragraph}>
            • Ces conditions d'utilisation{'\n'}
            • Le fonctionnement de l'application{'\n'}
            • Votre compte utilisateur{'\n'}
            • Des suggestions d'amélioration{'\n'}
            • Un signalement de contenu inapproprié
          </Text>
          
          <View style={styles.contactInfo}>
            <Text style={styles.contactText}>
              📧 <Text style={styles.bold}>Email :</Text> sobre.appli@gmail.com{'\n'}
              ⏱️ <Text style={styles.bold}>Délai de réponse :</Text> 48h maximum{'\n'}
              🏢 <Text style={styles.bold}>Équipe :</Text> Support SØBRE{'\n'}
              🌍 <Text style={styles.bold}>Langue :</Text> Français uniquement actuellement
            </Text>
          </View>
        </View>

        {/* Message de mission */}
        <View style={styles.missionSection}>
          <Text style={styles.missionTitle}>Notre mission avec vous</Text>
          <Text style={styles.missionText}>
            SØBRE existe pour vous accompagner vers la liberté et l'épanouissement. 
            Nous croyons en votre capacité à vous transformer et à reprendre le contrôle de votre vie. 
            Ces conditions existent pour protéger notre communauté bienveillante et 
            garantir que chacun puisse progresser en sécurité.
          </Text>
          <Text style={styles.missionSignature}>
            — L'équipe SØBRE
          </Text>
        </View>

        {/* Acceptation finale */}
        <View style={styles.acceptanceSection}>
          <Text style={styles.acceptanceText}>
            En utilisant SØBRE, vous confirmez avoir lu, compris et accepté 
            l'intégralité de ces conditions d'utilisation.
          </Text>
          <Text style={styles.acceptanceDate}>
            <Text style={styles.bold}>Version en vigueur :</Text> {formatDateFrench(new Date())}
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
    marginTop: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FFD700',
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#FFD700',
    lineHeight: 24,
  },
  emergencyContainer: {
    backgroundColor: '#1A1A2A',
    borderRadius: 12,
    padding: 20,
    marginTop: 12,
    borderWidth: 2,
    borderColor: '#DC2626',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  emergencyText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
    lineHeight: 24,
  },
  lastUpdated: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#A3A3A3',
    fontStyle: 'italic',
    marginTop: 8,
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
  missionSection: {
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  missionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#FFD700',
    marginBottom: 16,
    textAlign: 'center',
  },
  missionText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#F5F5F5',
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 16,
  },
  missionSignature: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#FFD700',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  acceptanceSection: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#333333',
    alignItems: 'center',
  },
  acceptanceText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 12,
  },
  acceptanceDate: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#A3A3A3',
    textAlign: 'center',
  },
});
