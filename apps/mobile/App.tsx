import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useMemo, useState, useEffect } from "react";
import { Image, ImageBackground, Pressable, ScrollView, StyleSheet, Text, View, ActivityIndicator } from "react-native";
import { useAuth } from "./src/useAuth";
import { api } from "./src/api";

type Tab = "home" | "services" | "booking" | "profile";

const c = {
  bg: "#131313",
  bgDeep: "#0E0E0E",
  surface: "#1C1B1B",
  emerald: "#064E3B",
  emeraldLight: "#95D3BA",
  gold: "#E9C349",
  text: "#E5E2E1",
  muted: "#BFC9C3",
  outline: "#404944",
  danger: "#FFB4AB"
};

export default function App() {
  const { user, loading, login, logout, canLogin } = useAuth();
  const [tab, setTab] = useState<Tab>("home");
  const [services, setServices] = useState<any[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  
  // Load services from API
  useEffect(() => {
    if (user) {
      api.get("/api/services").then(res => setServices(res.data.services)).catch(console.error);
    }
  }, [user]);

  if (loading) {
    return (
      <View style={[styles.shell, { justifyContent: "center" }]}>
        <ActivityIndicator size="large" color={c.emeraldLight} />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.loginPage}>
        <ImageBackground 
          source={{ uri: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80" }}
          style={styles.loginBg}
          imageStyle={{ opacity: 0.4 }}
        >
          <View style={styles.loginOverlay}>
            <Text style={styles.logo}>L'ÉLITE</Text>
            <Text style={styles.loginTitle}>Premium Grooming{"\n"}Waitlist</Text>
            <Pressable 
              style={[styles.googleButton, !canLogin && { opacity: 0.5 }]} 
              onPress={() => login()}
              disabled={!canLogin}
            >
              <Ionicons name="logo-google" size={20} color="#000" />
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </Pressable>
            {!canLogin && <Text style={styles.errorText}>Google Auth not configured</Text>}
          </View>
        </ImageBackground>
      </View>
    );
  }

  const toggleService = (id: string) => {
    setSelectedServices(curr => curr.includes(id) ? curr.filter(i => i !== id) : [...curr, id]);
  };

  const selectedTotal = useMemo(() => 
    selectedServices.reduce((sum, id) => sum + (services.find(s => s.id === id)?.price_inr ?? 0), 0),
  [selectedServices, services]);

  return (
    <View style={styles.shell}>
      <StatusBar style="light" />
      <TopBar onMenu={() => setTab("services")} onProfile={() => setTab("profile")} user={user} />
      
      {tab === "home" && <HomeScreen onBook={() => setTab("booking")} onMenu={() => setTab("services")} />}
      {tab === "services" && (
        <ServicesScreen 
          services={services}
          selectedServices={selectedServices} 
          onToggleService={toggleService} 
          total={selectedTotal} 
          onBook={() => setTab("booking")} 
        />
      )}
      {tab === "profile" && <ProfileScreen user={user} onLogout={logout} onBook={() => setTab("booking")} />}
      
      <BottomNav active={tab} onChange={setTab} />
    </View>
  );
}

function TopBar({ onMenu, onProfile, user }: any) {
  return (
    <View style={styles.topBar}>
      <Pressable onPress={onMenu} style={styles.iconButton}>
        <Ionicons name="menu" size={25} color={c.emeraldLight} />
      </Pressable>
      <Text style={styles.logo}>L'ÉLITE</Text>
      <Pressable onPress={onProfile} style={styles.avatarFrame}>
        <Image source={{ uri: `https://ui-avatars.com/api/?name=${user.name}&background=064E3B&color=fff` }} style={styles.avatar} />
      </Pressable>
    </View>
  );
}

function HomeScreen({ onBook, onMenu }: any) {
  return (
    <ScrollView style={styles.page}>
      <ImageBackground source={{ uri: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=900&q=80" }} style={styles.hero}>
        <View style={styles.heroOverlay}>
          <Text style={styles.heroTitle}>Professional Grooming</Text>
          <Pressable style={styles.goldButton} onPress={onBook}>
            <Text style={styles.goldButtonText}>Book Appointment</Text>
          </Pressable>
        </View>
      </ImageBackground>
    </ScrollView>
  );
}

function ServicesScreen({ services, selectedServices, onToggleService, total, onBook }: any) {
  return (
    <View style={styles.tabPage}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={styles.sectionTitle}>Our Services</Text>
        {services.map((s: any) => (
          <Pressable 
            key={s.id} 
            style={[styles.serviceCard, selectedServices.includes(s.id) && { borderColor: c.emeraldLight }]}
            onPress={() => onToggleService(s.id)}
          >
            <Text style={styles.serviceTitle}>{s.name}</Text>
            <Text style={styles.servicePrice}>₹{s.price_inr}</Text>
          </Pressable>
        ))}
      </ScrollView>
      {selectedServices.length > 0 && (
        <View style={styles.dock}>
          <Text style={styles.dockText}>Total: ₹{total}</Text>
          <Pressable style={styles.dockButton} onPress={onBook}>
            <Text style={styles.dockButtonText}>Proceed</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function ProfileScreen({ user, onLogout }: any) {
  return (
    <View style={[styles.page, { padding: 40, alignItems: "center" }]}>
      <Text style={styles.profileName}>{user.name}</Text>
      <Text style={styles.profileEmail}>{user.email}</Text>
      <Pressable style={styles.signOutButton} onPress={onLogout}>
        <Text style={styles.signOutText}>SIGN OUT</Text>
      </Pressable>
    </View>
  );
}

function BottomNav({ active, onChange }: any) {
  const items = [
    { id: "home", icon: "home-outline" },
    { id: "services", icon: "cut-outline" },
    { id: "profile", icon: "person-outline" }
  ];
  return (
    <View style={styles.bottomNav}>
      {items.map(i => (
        <Pressable key={i.id} onPress={() => onChange(i.id)}>
          <Ionicons name={i.icon as any} size={24} color={active === i.id ? c.emeraldLight : "#888"} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: c.bg },
  loginPage: { flex: 1 },
  loginBg: { flex: 1 },
  loginOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", padding: 30 },
  loginTitle: { color: "#fff", fontSize: 32, fontWeight: "900", textAlign: "center", marginVertical: 20 },
  googleButton: { backgroundColor: "#fff", flexDirection: "row", alignItems: "center", paddingHorizontal: 25, paddingVertical: 15, borderRadius: 10, gap: 10 },
  googleButtonText: { fontWeight: "bold", fontSize: 16 },
  topBar: { height: 100, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 40, backgroundColor: c.bgDeep },
  logo: { color: "#16D89A", fontSize: 22, fontWeight: "900" },
  avatarFrame: { width: 40, height: 40, borderRadius: 20, overflow: "hidden" },
  avatar: { width: "100%", height: "100%" },
  page: { flex: 1 },
  hero: { height: 300, justifyContent: "center", alignItems: "center" },
  heroOverlay: { backgroundColor: "rgba(0,0,0,0.5)", padding: 20, borderRadius: 10 },
  heroTitle: { color: "#fff", fontSize: 24, fontWeight: "bold" },
  goldButton: { backgroundColor: c.gold, padding: 15, borderRadius: 8, marginTop: 15 },
  goldButtonText: { fontWeight: "bold", textAlign: "center" },
  serviceCard: { backgroundColor: c.surface, padding: 20, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: "#333" },
  serviceTitle: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  servicePrice: { color: c.gold, marginTop: 5 },
  dock: { position: "absolute", bottom: 80, left: 20, right: 20, backgroundColor: c.surface, padding: 20, borderRadius: 15, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  dockText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  dockButton: { backgroundColor: c.emeraldLight, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  bottomNav: { height: 70, flexDirection: "row", justifyContent: "space-around", alignItems: "center", backgroundColor: c.bgDeep, borderTopWidth: 1, borderTopColor: "#222" },
  profileName: { color: "#fff", fontSize: 24, fontWeight: "bold" },
  profileEmail: { color: "#888", marginTop: 5 },
  signOutButton: { marginTop: 40, borderBottomWidth: 1, borderBottomColor: c.danger },
  signOutText: { color: c.danger, fontWeight: "bold" },
  errorText: { color: c.danger, marginTop: 10 }
});
