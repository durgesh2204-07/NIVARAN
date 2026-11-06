import { Language, RiskLevel, UserRole } from '../types';

export interface TranslationDict {
  appName: string;
  subtitle: string;
  tagline: string;
  trust1: string;
  trust2: string;
  trust3: string;
  loginTitle: string;
  signIn: string;
  ssoButton: string;
  continueAsGuest: string;
  devAccess: string;
  footerRights: string;
  systemStatusOnline: string;
  searchPlaceholder: string;
  askNivaran: string;
  signOut: string;
  roleAdministrator: string;
  roleDistrictOfficer: string;
  roleFieldOfficer: string;
  roleResponseTeam: string;
  roleCitizen: string;
  navDashboard: string;
  navGisWorkspace: string;
  navHazardMap: string;
  navVulnerability: string;
  navSiteSuitability: string;
  navPriorityRanking: string;
  navScenarioSimulator: string;
  navEarlyWarning: string;
  navIncidentCommand: string;
  navResourceManagement: string;
  navRelocationTracker: string;
  navCommunityReports: string;
  navCitizenPortal: string;
  navKnowledge: string;
  navAnalytics: string;
  navSettings: string;
  navAbout: string;
  nav: {
    dashboard: string;
    gisWorkspace: string;
    hazardMap: string;
    vulnerability: string;
    relocationSites: string;
    priorityRanking: string;
    simulator: string;
    earlyWarning: string;
    incidents: string;
    resources: string;
    relocationTracker: string;
    communityFeedback: string;
    citizenPortal: string;
    knowledge: string;
    analytics: string;
    settings: string;
    about: string;
  };
  roles: Record<UserRole, string>;
  riskLevels: Record<RiskLevel, string>;
  common: {
    explain: string;
    searchPlaceholder: string;
    signOut: string;
    askNivaran: string;
    households: string;
    population: string;
    district: string;
    verify: string;
    reject: string;
    approvePlan: string;
    exportCsv: string;
    exportPdf: string;
  };
}

export const TRANSLATIONS: Record<Language, TranslationDict> = {
  en: {
    appName: 'Nivaran',
    subtitle: 'National Disaster Risk, Red Zone & Relocation Management System',
    tagline: 'Move people before the disaster, not after.',
    trust1: 'Live Multi-Hazard GIS Red Zones',
    trust2: 'Carrying-Capacity Verified Host Sites',
    trust3: 'CAP Early Warning & Audit Ledger',
    loginTitle: 'Command & Operations Sign In',
    signIn: 'Sign In to Nivaran Command',
    ssoButton: 'Continue with Government Federated SSO (Jan Parichay)',
    continueAsGuest: 'Open Citizen Safety Portal (Guest Access)',
    devAccess: 'Developer Quick Access',
    footerRights: '© Nivaran · Terms · Privacy · Accessibility',
    systemStatusOnline: 'All GIS & Telemetry Feeds Operational',
    searchPlaceholder: 'Search villages, incidents, shelters, coordinates (Ctrl+K)...',
    askNivaran: 'Ask Nivaran',
    signOut: 'Sign Out',
    roleAdministrator: 'State / National Admin',
    roleDistrictOfficer: 'District Officer',
    roleFieldOfficer: 'Field Officer',
    roleResponseTeam: 'Response Team',
    roleCitizen: 'Citizen Portal',
    navDashboard: 'Command Dashboard',
    navGisWorkspace: 'GIS Map Workspace',
    navHazardMap: 'Hazard & Red Zones',
    navVulnerability: 'Vulnerability Index',
    navSiteSuitability: 'Site Suitability (MCDA)',
    navPriorityRanking: 'Relocation Planner',
    navScenarioSimulator: 'What-If & Climate',
    navEarlyWarning: 'Early Warning (CAP)',
    navIncidentCommand: 'Incident Management',
    navResourceManagement: 'Resources & Shelters',
    navRelocationTracker: 'Relocation Tracker',
    navCommunityReports: 'Field Verification',
    navCitizenPortal: 'Citizen Safety Portal',
    navKnowledge: 'SOPs & Preparedness',
    navAnalytics: 'Analytics & Reports',
    navSettings: 'Admin & Settings',
    navAbout: 'System Architecture',
    nav: {
      dashboard: 'Command Dashboard',
      gisWorkspace: 'GIS Map Workspace',
      hazardMap: 'Hazard & Red Zones',
      vulnerability: 'Vulnerability Index',
      relocationSites: 'Site Suitability (MCDA)',
      priorityRanking: 'Relocation Planner',
      simulator: 'What-If & Climate',
      earlyWarning: 'Early Warning (CAP)',
      incidents: 'Incident Management',
      resources: 'Resources & Shelters',
      relocationTracker: 'Relocation Tracker',
      communityFeedback: 'Field Verification',
      citizenPortal: 'Citizen Safety Portal',
      knowledge: 'SOPs & Preparedness',
      analytics: 'Analytics & Reports',
      settings: 'Admin & Settings',
      about: 'System Architecture',
    },
    roles: {
      administrator: 'State / National Administrator',
      sdma: 'State Authority (SDMA)',
      national_authority: 'National Authority (NDMA)',
      district_officer: 'District Officer (DDMA)',
      field_officer: 'Field Officer',
      response_team: 'Response Forces (NDRF / SDRF)',
      department_agency: 'Department / Scientific Agency',
      partner_org: 'Humanitarian Partner / NGO',
      citizen: 'Citizen / Community',
      villager: 'Citizen / Community',
    },
    riskLevels: {
      Immediate: 'Red / Immediate Relocate',
      'Short-term': 'Orange / Short-Term',
      'Medium-term': 'Watch / Medium-Term',
      Safe: 'Safe / Green Zone',
    },
    common: {
      explain: 'Explain Score',
      searchPlaceholder: 'Search villages, incidents, shelters, coordinates (Ctrl+K)...',
      signOut: 'Sign Out',
      askNivaran: 'Ask Nivaran',
      households: 'Households',
      population: 'Population',
      district: 'District',
      verify: 'Verify Report',
      reject: 'Reject',
      approvePlan: 'Approve Relocation Plan',
      exportCsv: 'Export CSV',
      exportPdf: 'Download PDF Report',
    },
  },
  hi: {
    appName: 'निवारण (Nivaran)',
    subtitle: 'राष्ट्रीय आपदा जोखिम, रेड-ज़ोन एवं पुनर्वास प्रबंधन प्रणाली',
    tagline: 'आपदा के बाद नहीं, आपदा से पहले सुरक्षित विस्थापन।',
    trust1: 'लाइव बहु-आपदा GIS रेड-ज़ोन',
    trust2: 'धारण-क्षमता सत्यापित पुनर्वास स्थल',
    trust3: 'CAP पूर्व चेतावनी एवं ऑडिट लेजर',
    loginTitle: 'कमांड एवं संचालन लॉगिन',
    signIn: 'निवारण कमांड में लॉगिन करें',
    ssoButton: 'सरकारी एकीकृत SSO (जन परिचय) से जारी रखें',
    continueAsGuest: 'नागरिक सुरक्षा पोर्टल खोलें (अतिथि प्रवेश)',
    devAccess: 'त्वरित रोल एक्सेस',
    footerRights: '© Nivaran · नियम · गोपनीयता · सुगम्यता',
    systemStatusOnline: 'सभी GIS एवं टेलीमेट्री सेवाएँ सक्रिय',
    searchPlaceholder: 'गाँव, घटना, आश्रय स्थल खोजें (Ctrl+K)...',
    askNivaran: 'निवारण सहायक',
    signOut: 'लॉग आउट',
    roleAdministrator: 'राज्य / राष्ट्रीय प्रशासक',
    roleDistrictOfficer: 'जिला अधिकारी (DDMA)',
    roleFieldOfficer: 'फील्ड अधिकारी',
    roleResponseTeam: 'बचाव दल (NDRF)',
    roleCitizen: 'नागरिक पोर्टल',
    navDashboard: 'कमांड डैशबोर्ड',
    navGisWorkspace: 'GIS मानचित्र कार्यक्षेत्र',
    navHazardMap: 'रेड-ज़ोन मानचित्रण',
    navVulnerability: 'संवेदनशीलता सूचकांक',
    navSiteSuitability: 'पुनर्वास स्थल एवं क्षमता',
    navPriorityRanking: 'प्राथमिकता पुनर्वास योजना',
    navScenarioSimulator: 'हस्तक्षेप एवं जलवायु सिम्युलेटर',
    navEarlyWarning: 'पूर्व चेतावनी (CAP)',
    navIncidentCommand: 'घटना प्रबंधन (Incidents)',
    navResourceManagement: 'संसाधन एवं राहत शिविर',
    navRelocationTracker: 'डिजिटल पुनर्वास ट्रैकर',
    navCommunityReports: 'क्षेत्रीय सत्यापन',
    navCitizenPortal: 'नागरिक सुरक्षा पोर्टल',
    navKnowledge: 'SOP एवं आपदा तैयारी',
    navAnalytics: 'विश्लेषण एवं रिपोर्ट',
    navSettings: 'प्रशासन एवं सेटिंग्स',
    navAbout: 'सिस्टम आर्किटेक्चर',
    nav: {
      dashboard: 'कमांड डैशबोर्ड',
      gisWorkspace: 'GIS मानचित्र कार्यक्षेत्र',
      hazardMap: 'रेड-ज़ोन मानचित्रण',
      vulnerability: 'संवेदनशीलता सूचकांक',
      relocationSites: 'पुनर्वास स्थल एवं क्षमता',
      priorityRanking: 'प्राथमिकता पुनर्वास योजना',
      simulator: 'हस्तक्षेप एवं जलवायु सिम्युलेटर',
      earlyWarning: 'पूर्व चेतावनी (CAP)',
      incidents: 'घटना प्रबंधन (Incidents)',
      resources: 'संसाधन एवं राहत शिविर',
      relocationTracker: 'डिजिटल पुनर्वास ट्रैकर',
      communityFeedback: 'क्षेत्रीय सत्यापन',
      citizenPortal: 'नागरिक सुरक्षा पोर्टल',
      knowledge: 'SOP एवं आपदा तैयारी',
      analytics: 'विश्लेषण एवं रिपोर्ट',
      settings: 'प्रशासन एवं सेटिंग्स',
      about: 'सिस्टम आर्किटेक्चर',
    },
    roles: {
      administrator: 'राज्य / राष्ट्रीय प्रशासक',
      sdma: 'राज्य आपदा प्राधिकरण (SDMA)',
      national_authority: 'राष्ट्रीय आपदा प्राधिकरण (NDMA)',
      district_officer: 'जिला अधिकारी (DDMA)',
      field_officer: 'फील्ड अधिकारी',
      response_team: 'बचाव दल (NDRF / SDRF)',
      department_agency: 'विभाग एवं वैज्ञानिक एजेंसी',
      partner_org: 'मानवीय सहयोगी संस्था (NGO)',
      citizen: 'नागरिक / समुदाय',
      villager: 'नागरिक / समुदाय',
    },
    riskLevels: {
      Immediate: 'लाल क्षेत्र / तत्काल पुनर्वास',
      'Short-term': 'नारंगी / अल्पकालिक जोखिम',
      'Medium-term': 'पीला / निगरानी क्षेत्र',
      Safe: 'सुरक्षित / हरा क्षेत्र',
    },
    common: {
      explain: 'स्कोर समझें',
      searchPlaceholder: 'गाँव, घटना, आश्रय स्थल खोजें (Ctrl+K)...',
      signOut: 'लॉग आउट',
      askNivaran: 'निवारण सहायक',
      households: 'परिवार',
      population: 'जनसंख्या',
      district: 'जिला',
      verify: 'सत्यापित करें',
      reject: 'अस्वीकार करें',
      approvePlan: 'पुनर्वास योजना स्वीकृत करें',
      exportCsv: 'CSV निर्यात',
      exportPdf: 'PDF रिपोर्ट',
    },
  },
  mr: {
    appName: 'निवारण (Nivaran)',
    subtitle: 'राष्ट्रीय आपत्ती जोखीम, रेड-झोन व पुनर्वसन व्यवस्थापन प्रणाली',
    tagline: 'आपत्तीनंतर नव्हे, आपत्तीपूर्वीच सुरक्षित स्थलांतर.',
    trust1: 'लाइव्ह बहु-आपत्ती GIS रेड-झोन',
    trust2: 'धारण-क्षमता तपासलेली पुनर्वसन स्थळे',
    trust3: 'CAP पूर्वसूचना व ऑडिट लेजर',
    loginTitle: 'नियंत्रण व संचालन लॉगिन',
    signIn: 'निवारण कमांडमध्ये प्रवेश करा',
    ssoButton: 'शासकीय एकत्रित SSO (जन परिचय) द्वारे सुरू ठेवा',
    continueAsGuest: 'नागरिक सुरक्षा पोर्टल उघडा (थेट प्रवेश)',
    devAccess: 'जलद भूमिका प्रवेश',
    footerRights: '© Nivaran · अटी · गोपनीयता · सुलभता',
    systemStatusOnline: 'सर्व GIS आणि सेन्सर प्रणाली कार्यान्वित',
    searchPlaceholder: 'गाव, घटना, निवारा केंद्र शोधा (Ctrl+K)...',
    askNivaran: 'निवारण सहाय्यक',
    signOut: 'बाहेर पडा',
    roleAdministrator: 'राज्य / राष्ट्रीय प्रशासक',
    roleDistrictOfficer: 'जिल्हाधिकारी (DDMA)',
    roleFieldOfficer: 'क्षेत्रीय अधिकारी',
    roleResponseTeam: 'बचाव पथक (NDRF)',
    roleCitizen: 'नागरिक पोर्टल',
    navDashboard: 'मुख्य नियंत्रण कक्ष',
    navGisWorkspace: 'GIS नकाशा कार्यक्षेत्र',
    navHazardMap: 'रेड-झोन नकाशा',
    navVulnerability: 'संवेदनशीलता निर्देशांक',
    navSiteSuitability: 'पुनर्वसन जागा व क्षमता',
    navPriorityRanking: 'प्राधान्य पुनर्वसन आराखडा',
    navScenarioSimulator: 'उपाययोजना व हवामान सिम्युलेटर',
    navEarlyWarning: 'पूर्वसूचना प्रणाली (CAP)',
    navIncidentCommand: 'आपत्ती घटना व्यवस्थापन',
    navResourceManagement: 'साधनसामग्री व निवारा केंद्रे',
    navRelocationTracker: 'डिजिटल पुनर्वसन ट्रॅकर',
    navCommunityReports: 'क्षेत्रीय पडताळणी',
    navCitizenPortal: 'नागरिक सुरक्षा पोर्टल',
    navKnowledge: 'SOP आणि पूर्वतयारी',
    navAnalytics: 'विश्लेषण आणि अहवाल',
    navSettings: 'प्रशासन व सेटिंग्ज',
    navAbout: 'प्रणाली रचना (Architecture)',
    nav: {
      dashboard: 'मुख्य नियंत्रण कक्ष',
      gisWorkspace: 'GIS नकाशा कार्यक्षेत्र',
      hazardMap: 'रेड-झोन नकाशा',
      vulnerability: 'संवेदनशीलता निर्देशांक',
      relocationSites: 'पुनर्वसन जागा व क्षमता',
      priorityRanking: 'प्राधान्य पुनर्वसन आराखडा',
      simulator: 'उपाययोजना व हवामान सिम्युलेटर',
      earlyWarning: 'पूर्वसूचना प्रणाली (CAP)',
      incidents: 'आपत्ती घटना व्यवस्थापन',
      resources: 'साधनसामग्री व निवारा केंद्रे',
      relocationTracker: 'डिजिटल पुनर्वसन ट्रॅकर',
      communityFeedback: 'क्षेत्रीय पडताळणी',
      citizenPortal: 'नागरिक सुरक्षा पोर्टल',
      knowledge: 'SOP आणि पूर्वतयारी',
      analytics: 'विश्लेषण आणि अहवाल',
      settings: 'प्रशासन व सेटिंग्ज',
      about: 'प्रणाली रचना (Architecture)',
    },
    roles: {
      administrator: 'राज्य / राष्ट्रीय प्रशासक',
      sdma: 'राज्य आपत्ती प्राधिकरण (SDMA)',
      national_authority: 'राष्ट्रीय आपत्ती प्राधिकरण (NDMA)',
      district_officer: 'जिल्हाधिकारी (DDMA)',
      field_officer: 'क्षेत्रीय अधिकारी',
      response_team: 'बचाव पथक (NDRF / SDRF)',
      department_agency: 'विभाग व वैज्ञानिक संस्था',
      partner_org: 'मानवतावादी भागीदार संस्था (NGO)',
      citizen: 'नागरिक / ग्रामस्थ',
      villager: 'नागरिक / ग्रामस्थ',
    },
    riskLevels: {
      Immediate: 'रेड झोन / तात्काळ स्थलांतर',
      'Short-term': 'ऑरेंज / अल्पकालीन धोका',
      'Medium-term': 'यलो / निरीक्षण क्षेत्र',
      Safe: 'सुरक्षित / ग्रीन झोन',
    },
    common: {
      explain: 'स्कोअर स्पष्टीकरण',
      searchPlaceholder: 'गाव, घटना, निवारा केंद्र शोधा (Ctrl+K)...',
      signOut: 'बाहेर पडा',
      askNivaran: 'निवारण सहाय्यक',
      households: 'कुटुंबे',
      population: 'लोकसंख्या',
      district: 'जिल्हा',
      verify: 'तपासणी मंजूर करा',
      reject: 'नाकारा',
      approvePlan: 'पुनर्वसन आराखडा मंजूर करा',
      exportCsv: 'CSV निर्यात करा',
      exportPdf: 'PDF अहवाल',
    },
  },
};

export const translations = TRANSLATIONS;
