import React, { useState, useEffect, useRef } from 'react';
import './styles/variables.css';
import './styles/components.css';

// Services
import { db } from './services/db';
import { authService, DEMO_PATIENT, DEMO_PHARMACIES_ACCOUNTS } from './services/authService';
import { findNearbyPharmacies } from './services/pharmacySearch';
import { notificationService } from './services/notificationService';
import { progressiveSearchService } from './services/progressiveSearchService';
import { DEFAULT_USER_LOCATION } from './data/mockData';
import { initRealLocationAndPharmacies, fetchNearbyPharmacies, fetchNearbyPharmaciesRoad } from './services/geolocationService';

// Common Components
import TopBar from './components/common/TopBar';
import BottomNav from './components/common/BottomNav';
import ModeSwitcher from './components/common/ModeSwitcher';
import ToastAlert from './components/common/ToastAlert';
import CallSimulatorModal from './components/common/CallSimulatorModal';
import PhoneSimulator from './components/common/PhoneSimulator';

// Patient Components
import HomeScreen from './components/patient/HomeScreen';
import MedicineSearchScreen from './components/patient/MedicineSearchScreen';
import DutyPharmaciesScreen from './components/patient/DutyPharmaciesScreen';
import PrescriptionResultScreen from './components/patient/PrescriptionResultScreen';
import SearchResultsScreen from './components/patient/SearchResultsScreen';
import ConfirmedPharmaciesScreen from './components/patient/ConfirmedPharmaciesScreen';
import PharmaciesListScreen from './components/patient/PharmaciesListScreen';
import CreateAccountScreen from './components/patient/CreateAccountScreen';
import PharmacyDetailModal from './components/patient/PharmacyDetailModal';
import PatientAuthModal from './components/patient/PatientAuthModal';
import { analyzePrescription, compressPhotoForSharing } from './services/analyzer';

// Pharmacy Components
import PharmacyHomeScreen from './components/pharmacy/PharmacyHomeScreen';
import MedicineStockScreen from './components/pharmacy/MedicineStockScreen';
import RequestHistoryScreen from './components/pharmacy/RequestHistoryScreen';

// Navigation Components
import ItineraryModal from './components/navigation/ItineraryModal';

export default function App() {
  // Global Session & Role States
  const [role, setRole] = useState('patient'); // 'patient' | 'pharmacist'
  const [activePharmacyId, setActivePharmacyId] = useState('pharmacy_005');
  const [isSplitView, setIsSplitView] = useState(false);
  const [toast, setToast] = useState(null);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

  // Real User Location & Dynamic Nearby Pharmacies
  const [userLocation, setUserLocation] = useState(DEFAULT_USER_LOCATION);
  const [allPharmaciesList, setAllPharmaciesList] = useState([]);
  const userLocationRef = useRef(DEFAULT_USER_LOCATION);

  // Patient App Navigation States
  const [activePatientTab, setActivePatientTab] = useState('home'); // 'home' | 'medicine' | 'duty'
  const [patientScreen, setPatientScreen] = useState('home'); 
  // 'home' | 'medicine' | 'duty' | 'scan' | 'results' | 'search-results'
  const [isScanning, setIsScanning] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [scanStatusText, setScanStatusText] = useState('Scan en cours...');
  const [isExitingHome, setIsExitingHome] = useState(false);
  const [selectedZone, setSelectedZone] = useState('dakar');
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);
  const [activePrescriptionMedicines, setActivePrescriptionMedicines] = useState([]);
  const [prescriptionId, setPrescriptionId] = useState(null);
  const [autoOpenCamera, setAutoOpenCamera] = useState(false);

  const prescriptionIdRef = useRef(null);
  const isScanningRef = useRef(false);
  const confirmationTimerRef = useRef(null);
  const firstConfirmationTimeRef = useRef(null);

  useEffect(() => {
    userLocationRef.current = userLocation;
  }, [userLocation]);

  // Initialisation et suivi en temps réel du GPS de l'appareil
  useEffect(() => {
    let isMounted = true;
    initRealLocationAndPharmacies()
      .then(({ userLocation: loc, pharmacies: phs, activePharmacy: activePh }) => {
        if (!isMounted) return;
        setUserLocation(loc);
        setAllPharmaciesList(phs);
        if (activePh) {
          setActivePharmacyId(activePh.id);
        }
      })
      .catch((err) => {
        console.warn('Real location init error:', err);
      });

    // Suivi GPS dynamique direct : dès que la géolocalisation se précise, recalcul immédiat
    let watchId = null;
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          if (!isMounted) return;
          const liveLoc = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            name: 'Position GPS actuelle',
            accuracy: pos.coords.accuracy || 10,
            isReal: true
          };
          setUserLocation(liveLoc);
          fetchNearbyPharmaciesRoad(liveLoc)
            .then((dynamicPharms) => {
              if (!isMounted) return;
              setAllPharmaciesList(dynamicPharms);
              db.setPharmacies(dynamicPharms);
            })
            .catch(() => {
              const fallbackPharms = fetchNearbyPharmacies(liveLoc);
              setAllPharmaciesList(fallbackPharms);
            });
        },
        () => {},
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
      );
    }

    return () => {
      isMounted = false;
      if (watchId !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);

  useEffect(() => {
    prescriptionIdRef.current = prescriptionId;
  }, [prescriptionId]);

  useEffect(() => {
    isScanningRef.current = isScanning;
  }, [isScanning]);

  useEffect(() => {
    return () => {
      if (confirmationTimerRef.current) {
        clearTimeout(confirmationTimerRef.current);
      }
    };
  }, []);

  // Pharmacy App Navigation States
  const [activePharmacyTab, setActivePharmacyTab] = useState('pharmacy-home'); 
  // 'pharmacy-home' | 'pharmacy-stock' | 'pharmacy-history'

  // Modals
  const [detailsModalPharmacy, setDetailsModalPharmacy] = useState(null);
  const [detailsMedicinesBreakdown, setDetailsMedicinesBreakdown] = useState([]);
  const [itineraryPharmacy, setItineraryPharmacy] = useState(null);
  const [callPharmacy, setCallPharmacy] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Lien direct par rôle : ?role=patient ou ?role=pharmacie (connexion pharmacie de test automatique)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const requested = (new URLSearchParams(window.location.search).get('role') || '').toLowerCase();
    if (['pharmacie', 'pharmacy', 'pharmacien', 'pharmacist'].includes(requested)) {
      const res = authService.loginWithEmail({ email: 'admin', password: 'admin' });
      if (res?.success) handleAuthSuccess(res.user);
    } else if (requested === 'patient') {
      setRole('patient');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Authentification réussie (Patient ou Pharmacien Démo admin/admin)
  const handleAuthSuccess = (user) => {
    if (user && (user.role === 'pharmacist' || user.isAdminDemo)) {
      setRole('pharmacist');
      setActivePharmacyId(user.pharmacyId || 'pharmacy_test');
      setActivePharmacyTab('pharmacy-home');
      setPatientScreen('home');
    } else {
      setToast({
        type: 'success',
        message: `Bienvenue ${user?.name || ''} !`
      });
      setPatientScreen('home');
    }
  };

  // Transition vers la page des pharmacies une fois qu'un pharmacien a confirmé
  const navigateToPharmaciesAfterConfirmation = () => {
    setScanSuccess(true);
    setScanStatusText('Pharmacie trouvée !');
    setTimeout(() => {
      setIsExitingHome(true);
      setTimeout(() => {
        setIsScanning(false);
        setScanSuccess(false);
        setIsExitingHome(false);
        setPatientScreen('results');
      }, 250);
    }, 450);
  };

  // Attendre 5s après le début de la première confirmation (pour le test)
  const handleConfirmationReceived = (targetPrescriptionId) => {
    if (!isScanningRef.current) return;
    if (prescriptionIdRef.current && targetPrescriptionId && targetPrescriptionId !== prescriptionIdRef.current) {
      return;
    }

    // Si le compte à rebours de 5s n'a pas encore débuté pour cette ordonnance :
    if (!firstConfirmationTimeRef.current) {
      firstConfirmationTimeRef.current = Date.now();

      // On attend 5 secondes avant d'afficher la page des pharmacies
      confirmationTimerRef.current = setTimeout(() => {
        navigateToPharmaciesAfterConfirmation();
        firstConfirmationTimeRef.current = null;
        confirmationTimerRef.current = null;
      }, 5000);
    }
  };

  // Load pending count & subscribe to real-time events
  const updatePendingCount = () => {
    const list = db.getRequests(activePharmacyId).filter((r) => r.status === 'PENDING');
    setPendingRequestsCount(list.length);
  };

  useEffect(() => {
    updatePendingCount();

    const unsubscribe = db.subscribe((event) => {
      updatePendingCount();

      if (event.type === 'REQUEST_CREATED') {
        // Son discret si l'officine est active
        if (event.request.pharmacyId === activePharmacyId && role === 'pharmacist') {
          notificationService.playAlertSound();
        }
      } else if (event.type === 'REQUEST_RESPONDED' && event.status === 'AVAILABLE') {
        // Déclenche le délai de 5s après la première confirmation (mode test)
        const targetPrescriptionId = event.request?.prescriptionId;
        handleConfirmationReceived(targetPrescriptionId);
      }
    });

    return unsubscribe;
  }, [activePharmacyId]);

  useEffect(() => {
    const unsubscribeProgressive = progressiveSearchService.subscribe((state) => {
      if (state.hasAvailableResponse && isScanningRef.current) {
        handleConfirmationReceived(prescriptionIdRef.current);
      }
    });
    return unsubscribeProgressive;
  }, []);

  // Handler: Switch between Patient Tabs
  const handleSelectPatientTab = (tab) => {
    setActivePatientTab(tab);
    setPatientScreen(tab);
  };

  // Handler: Confirm photo and start OCR processing directly on Home page
  const handleConfirmPhoto = async (photoPayload) => {
    if (confirmationTimerRef.current) {
      clearTimeout(confirmationTimerRef.current);
      confirmationTimerRef.current = null;
    }
    firstConfirmationTimeRef.current = null;

    setCapturedPhoto(photoPayload);
    setIsScanning(true);
    setScanStatusText('Scan en cours...');
    setScanSuccess(false);
    setIsExitingHome(false);
    setPatientScreen('home'); // Ensure we remain on the first/home screen!

    try {
      // Une vraie photo est toujours lue par Gemini ; l'exemple de démo n'est utilisé que sans photo
      const result = await analyzePrescription(photoPayload?.dataUrl || null, {
        presetMedicines: photoPayload?.dataUrl ? null : photoPayload?.preset?.medicines,
        onProgress: ({ stage }) => {
          if (stage?.id === 'verifying') setScanStatusText('Vérification en ligne...');
        }
      });

      const resolvedPrescriptionId = result.prescriptionId || `presc_${Date.now()}`;
      setAnalysisData(result);
      setActivePrescriptionMedicines(result.medicines || []);
      setPrescriptionId(resolvedPrescriptionId);
      prescriptionIdRef.current = resolvedPrescriptionId;

      // Transition : le terme "Scan" se transforme en "Recherche de pharmacie..."
      setScanStatusText('Recherche de pharmacie...');

      if (result.missingLines > 0) {
        setToast({
          type: 'error',
          title: 'Ordonnance partiellement lue',
          message: `${result.missingLines} ligne(s) de l'ordonnance n'ont pas pu être lues. Le pharmacien a la photo pour vérifier.`
        });
        setTimeout(() => setToast(null), 10000);
      }

      // Photo allégée pour les pharmacies (la photo originale peut dépasser la capacité du navigateur)
      const sharedPhoto = photoPayload?.dataUrl
        ? await compressPhotoForSharing(photoPayload.dataUrl)
        : photoPayload?.preset?.imageUrl;

      // Envoi de la demande aux pharmacies par rayon progressif
      progressiveSearchService.startSearch({
        medicines: result.medicines || [],
        prescriptionId: resolvedPrescriptionId,
        prescriptionPhoto: sharedPhoto,
        userLocation: userLocationRef.current
      });

      // Le patient reste sur l'écran d'accueil jusqu'à confirmation d'un pharmacien !
    } catch (err) {
      // Pas de médicaments inventés : on arrête le scan et on explique le problème
      console.warn('Analyse ordonnance échouée:', err);
      setIsScanning(false);
      setScanSuccess(false);
      setScanStatusText('Scan en cours...');
      setToast({
        type: 'error',
        title: "Ordonnance non lue",
        message: err?.message || "Impossible de lire l'ordonnance. Réessayez avec une photo plus nette."
      });
      setTimeout(() => setToast(null), 30000);
    }
  };

  const handleRetakePhoto = () => {
    setAutoOpenCamera(true);
    setPatientScreen('home');
  };

  // Handler: OCR Analysis completed
  const handleAnalysisComplete = (result) => {
    setAnalysisData(result);
    setActivePrescriptionMedicines(result.medicines || []);
    setPrescriptionId(result.prescriptionId);
    setPatientScreen('results');
  };

  // Handler: Confirm medicines and launch Pharmacy Search
  const handleConfirmMedicines = (confirmedMeds) => {
    setActivePrescriptionMedicines(confirmedMeds);
    setPatientScreen('search-results');
  };

  // Handler: Quick search from Medicine Search screen
  const handleQuickMedicineSearch = (med) => {
    setActivePrescriptionMedicines([med]);
    setPrescriptionId(`search_single_${Date.now()}`);
    setPatientScreen('search-results');
  };

  const handleCustomSearchSubmit = (searchTerm) => {
    // Extraire le dosage s'il est inclus dans le terme (ex: "Paracétamol 1g" ou "Amoxicilline 500mg")
    const dosageMatch = searchTerm.match(/(\d+\s*(?:mg|g|ml|mcg|µg|ui|ui\/ml))/i);
    const extractedDosage = dosageMatch ? dosageMatch[1].trim() : '';
    const medName = searchTerm.replace(dosageMatch?.[0] || '', '').trim() || searchTerm;

    const searchMeds = [{ name: medName, dosage: extractedDosage || '' }];
    const searchPrescriptionId = `search_custom_${Date.now()}`;

    setActivePrescriptionMedicines(searchMeds);
    setPrescriptionId(searchPrescriptionId);
    prescriptionIdRef.current = searchPrescriptionId;
    setIsScanning(true);
    setScanStatusText('Recherche de pharmacie...');
    setScanSuccess(false);

    // Lance la recherche progressive vers les pharmacies
    progressiveSearchService.startSearch({
      medicines: searchMeds,
      prescriptionId: searchPrescriptionId,
      userLocation: userLocationRef.current
    });

    // Navigue directement vers l'écran des résultats
    setPatientScreen('search-results');
  };

  // Handler: Open Details Modal
  const handleOpenDetails = (pharmacy, breakdown) => {
    setDetailsModalPharmacy(pharmacy);
    setDetailsMedicinesBreakdown(breakdown);
  };

  // Reset Demo
  const handleResetDemo = () => {
    if (confirmationTimerRef.current) {
      clearTimeout(confirmationTimerRef.current);
      confirmationTimerRef.current = null;
    }
    firstConfirmationTimeRef.current = null;

    db.resetToDefault();
    setActivePrescriptionMedicines([
      { name: 'Amoxicilline', dosage: '500 mg' },
      { name: 'Paracétamol', dosage: '1 g' },
      { name: 'Ibuprofène', dosage: '400 mg' }
    ]);
    setPatientScreen('home');
    setActivePatientTab('home');
    updatePendingCount();
    setToast({
      type: 'confirmed',
      title: 'Données réinitialisées',
      message: 'Base de démo restaurée avec les officines de Dakar.'
    });
    setTimeout(() => setToast(null), 3000);
  };

  const nearbyPharmacies = findNearbyPharmacies(userLocation);
  const activePharmacy = db.getPharmacyById(activePharmacyId) || allPharmaciesList[0] || nearbyPharmacies[0] || DEMO_PHARMACIES_ACCOUNTS[0];

  // Subtitle for TopBar
  const getPatientSubtitle = () => {
    switch (patientScreen) {
      case 'home': return 'Accueil';
      case 'medicine': return 'Médicament';
      case 'duty': return 'Garde';
      case 'scan': return 'Numérisation';
      case 'processing': return 'Lecture';
      case 'result': return 'Ordonnance';
      case 'search-results': return 'Disponibilités';
      default: return 'Accueil';
    }
  };

  const getPharmacySubtitle = () => {
    switch (activePharmacyTab) {
      case 'pharmacy-home': return 'Demandes';
      case 'pharmacy-stock': return 'Stock';
      case 'pharmacy-history': return 'Historique';
      default: return 'Officine';
    }
  };

  // Render Patient Screen Content
  const renderPatientInterface = () => (
    <PhoneSimulator isSplitView={isSplitView}>
      <div className={`mobile-device-container ${isSplitView ? 'split-screen' : ''}`} style={{ width: '100%', height: '100%', minHeight: '100%', boxShadow: 'none', background: patientScreen === 'home' ? 'transparent' : '#F8F9FA' }}>
      {patientScreen !== 'home' && patientScreen !== 'pharmacies-list' && patientScreen !== 'create-account' && (
        <TopBar
          role="patient"
          showBack={true}
          onBack={() => setPatientScreen('home')}
          onLogoClick={() => setPatientScreen('home')}
        />
      )}

      {/* Sliding Viewport for Home, Pharmacies List & Create Account */}
      {(patientScreen === 'home' || patientScreen === 'pharmacies-list' || patientScreen === 'create-account') && (
        <div style={{ position: 'relative', width: '100%', height: '100%', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          {/* Home Screen Layer */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              transform:
                patientScreen === 'pharmacies-list'
                  ? 'translateX(-28%) scale(0.96)'
                  : patientScreen === 'create-account'
                  ? 'translateX(28%) scale(0.96)'
                  : 'translateX(0) scale(1)',
              opacity: patientScreen === 'pharmacies-list' || patientScreen === 'create-account' ? 0.35 : 1,
              transition: 'transform 0.34s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.34s ease',
              pointerEvents: patientScreen === 'home' ? 'auto' : 'none'
            }}
          >
            <HomeScreen
              isScanning={isScanning}
              scanSuccess={scanSuccess}
              scanStatusText={scanStatusText}
              isExiting={isExitingHome}
              autoOpenCamera={autoOpenCamera}
              onCameraClosed={() => setAutoOpenCamera(false)}
              onStartScan={(payload) => {
                setAutoOpenCamera(false);
                handleConfirmPhoto(payload);
              }}
              onSelectSample={(sample) => handleConfirmPhoto({ preset: sample })}
              onNavigateToPharmacies={() => setPatientScreen('pharmacies-list')}
              onOpenAccountSuccess={handleAuthSuccess}
              onSearchText={(query) => handleCustomSearchSubmit(query)}
              onBack={() => {
                if (confirmationTimerRef.current) {
                  clearTimeout(confirmationTimerRef.current);
                  confirmationTimerRef.current = null;
                }
                firstConfirmationTimeRef.current = null;
                setIsScanning(false);
                setScanSuccess(false);
                setAutoOpenCamera(false);
              }}
            />
          </div>

          {/* Sliding Create Account Menu Layer (Slides in from the Left) */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              zIndex: 36,
              backgroundColor: '#FFFFFF',
              transform: patientScreen === 'create-account' ? 'translateX(0)' : 'translateX(-100%)',
              boxShadow: patientScreen === 'create-account' ? '12px 0 35px rgba(0, 0, 0, 0.18)' : 'none',
              transition: 'transform 0.34s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.34s ease',
              pointerEvents: patientScreen === 'create-account' ? 'auto' : 'none',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            <CreateAccountScreen
              onBack={() => setPatientScreen('home')}
              onSuccess={handleAuthSuccess}
            />
          </div>

          {/* Sliding Pharmacies Menu Layer (Slides in from the Right) */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              zIndex: 35,
              backgroundColor: '#F8F9FA',
              transform: patientScreen === 'pharmacies-list' ? 'translateX(0)' : 'translateX(100%)',
              boxShadow: patientScreen === 'pharmacies-list' ? '-12px 0 35px rgba(0, 0, 0, 0.18)' : 'none',
              transition: 'transform 0.34s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.34s ease',
              pointerEvents: patientScreen === 'pharmacies-list' ? 'auto' : 'none',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            <PharmaciesListScreen
              pharmacies={nearbyPharmacies}
              onBack={() => setPatientScreen('home')}
              onCallPharmacy={(p) => setCallPharmacy(p)}
              onOpenItinerary={(p) => setItineraryPharmacy(p)}
            />
          </div>
        </div>
      )}

      {patientScreen === 'scan' && (
        <HomeScreen
          isScanning={isScanning}
          scanSuccess={scanSuccess}
          scanStatusText={scanStatusText}
          isExiting={isExitingHome}
          autoOpenCamera={true}
          onCameraClosed={() => {
            setAutoOpenCamera(false);
            setPatientScreen('home');
          }}
          onStartScan={(payload) => {
            setAutoOpenCamera(false);
            handleConfirmPhoto(payload);
          }}
          onSelectSample={(sample) => handleConfirmPhoto({ preset: sample })}
          onNavigateToPharmacies={() => setPatientScreen('pharmacies-list')}
          onOpenAccountSuccess={handleAuthSuccess}
          onSearchText={(query) => handleCustomSearchSubmit(query)}
        />
      )}

      {(patientScreen === 'results' || patientScreen === 'search-results') && (
        <ConfirmedPharmaciesScreen
          medicines={activePrescriptionMedicines}
          pharmacies={nearbyPharmacies}
          userLocation={userLocation}
          prescriptionId={prescriptionId}
          prescriptionPhoto={capturedPhoto?.dataUrl || capturedPhoto?.preset?.imageUrl}
          onCallPharmacy={(p) => setCallPharmacy(p)}
          onOpenItinerary={(p) => setItineraryPharmacy(p)}
          onNewScan={handleRetakePhoto}
        />
      )}

        {/* Contained Itinerary Modal (stays inside app screen like camera) */}
        {itineraryPharmacy && (
          <ItineraryModal
            pharmacy={itineraryPharmacy}
            userLocation={userLocation}
            onClose={() => setItineraryPharmacy(null)}
          />
        )}
      </div>
    </PhoneSimulator>
  );

  // Render Pharmacy Screen Content
  const renderPharmacyInterface = () => (
    <PhoneSimulator isSplitView={isSplitView}>
      <div className={`mobile-device-container ${isSplitView ? 'split-screen' : ''}`} style={{ width: '100%', height: '100%', minHeight: '100%', boxShadow: 'none', background: 'transparent' }}>
        {activePharmacyTab === 'pharmacy-home' && (
        <PharmacyHomeScreen
          pharmacy={activePharmacy}
          onNavigateToStock={() => setActivePharmacyTab('pharmacy-stock')}
          onLogout={() => {
            authService.logoutPatient();
            setRole('patient');
          }}
        />
      )}

      {activePharmacyTab === 'pharmacy-stock' && (
        <MedicineStockScreen pharmacy={activePharmacy} />
      )}

      {activePharmacyTab === 'pharmacy-history' && (
        <RequestHistoryScreen pharmacy={activePharmacy} />
      )}

      <BottomNav
        role="pharmacist"
        activeTab={activePharmacyTab}
        onSelectTab={setActivePharmacyTab}
        pendingRequestsCount={pendingRequestsCount}
      />

        {/* Contained Itinerary Modal */}
        {itineraryPharmacy && (
          <ItineraryModal
            pharmacy={itineraryPharmacy}
            userLocation={userLocation}
            onClose={() => setItineraryPharmacy(null)}
          />
        )}
      </div>
    </PhoneSimulator>
  );

  return (
    <div className="app-layout-wrapper">
      {role === 'patient' ? renderPatientInterface() : renderPharmacyInterface()}

      <ToastAlert toast={toast} onClose={() => setToast(null)} />

      {/* Modals and Overlays */}

      {/* Pharmacy Details Modal */}
      {detailsModalPharmacy && (
        <PharmacyDetailModal
          pharmacy={detailsModalPharmacy}
          medicinesBreakdown={detailsMedicinesBreakdown}
          onClose={() => setDetailsModalPharmacy(null)}
          onCall={(p) => setCallPharmacy(p)}
          onOpenItinerary={(p) => setItineraryPharmacy(p)}
        />
      )}


      {/* Telephone Call Simulator Modal */}
      {callPharmacy && (
        <CallSimulatorModal
          pharmacy={callPharmacy}
          onClose={() => setCallPharmacy(null)}
        />
      )}

      {/* Patient Auth Modal */}
      {showAuthModal && (
        <PatientAuthModal
          session={authService.getSession()}
          onClose={() => setShowAuthModal(false)}
        />
      )}
    </div>
  );
}
