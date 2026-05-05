import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import { Image, ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

type Tab = "home" | "services" | "booking" | "profile";
type Service = {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  category: string;
  premium?: boolean;
};

const c = {
  bg: "#131313",
  bgDeep: "#0E0E0E",
  surface: "#1C1B1B",
  surface2: "#201F1F",
  surface3: "#2A2A2A",
  emerald: "#064E3B",
  emeraldLight: "#95D3BA",
  emeraldText: "#80BEA6",
  gold: "#E9C349",
  goldDeep: "#AF8D11",
  text: "#E5E2E1",
  muted: "#BFC9C3",
  outline: "#404944",
  outlineLight: "#89938D",
  danger: "#FFB4AB"
};

const bookingDeposit = {
  barberAdvanceInr: 20,
  platformChargeInr: 2,
  get totalInr() {
    return this.barberAdvanceInr + this.platformChargeInr;
  }
};

const barbers = [
  {
    id: "arthur",
    name: "Arthur P.",
    role: "Master Crafter",
    rating: "4.9",
    cuts: "120+ cuts",
    image: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=240&q=80"
  },
  {
    id: "julian",
    name: "Julian M.",
    role: "Senior Barber",
    rating: "4.7",
    cuts: "85+ cuts",
    image: "https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=240&q=80"
  }
] as const;

const services: Service[] = [
  { id: "hair", name: "Hair Cutting", description: "Precision cut tailored to your face shape.", price: 50, icon: "content-cut", category: "Basic Services" },
  { id: "shave", name: "Shaving", description: "Classic clean shave with hot towel finish.", price: 30, icon: "face-man-shimmer", category: "Basic Services" },
  { id: "beard", name: "Beard Setting", description: "Sculpting and shaping for a sharp look.", price: 50, icon: "face-man", category: "Grooming" },
  { id: "package", name: "Facial + Shaving Package", description: "Deep cleansing facial followed by a luxurious royal shave.", price: 1200, icon: "spa-outline", category: "Premium", premium: true },
  { id: "spa", name: "Hair Spa", description: "Deep conditioning treatment.", price: 300, icon: "water-outline", category: "Grooming" },
  { id: "massage", name: "Massage", description: "Relaxing head and shoulder massage.", price: 100, icon: "hand-heart-outline", category: "Basic Services" },
  { id: "detan", name: "Detan", description: "Sun damage removal and skin brightening.", price: 250, icon: "white-balance-sunny", category: "Grooming" },
  { id: "color", name: "L'Oreal Color", description: "Premium brand hair coloring.", price: 550, icon: "palette-outline", category: "Premium" },
  { id: "straight", name: "Hair Straightening", description: "Sleek, straight finish.", price: 1050, icon: "ruler", category: "Premium" }
] as const satisfies Service[];

const timeGroups: Array<{ label: string; icon: keyof typeof Ionicons.glyphMap; slots: string[]; disabled: string[] }> = [
  { label: "Morning", icon: "sunny-outline" as const, slots: ["09:00", "10:30", "11:15"], disabled: ["09:00"] },
  { label: "Afternoon", icon: "partly-sunny-outline" as const, slots: ["13:00", "14:30", "16:00"], disabled: [] },
  { label: "Evening", icon: "moon-outline" as const, slots: ["18:15", "19:30"], disabled: [] }
];

export default function App() {
  const [tab, setTab] = useState<Tab>("home");
  const [selectedServices, setSelectedServices] = useState(["package", "hair"]);
  const [selectedBarber, setSelectedBarber] = useState<"arthur" | "julian">("arthur");
  const [selectedDay, setSelectedDay] = useState("THU");
  const [selectedTime, setSelectedTime] = useState("14:30");
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [profileNotice, setProfileNotice] = useState("Account ready");

  const selectedTotal = useMemo(
    () => selectedServices.reduce((sum, id) => sum + (services.find((service) => service.id === id)?.price ?? 0), 0),
    [selectedServices]
  );
  const bookingBarber = barbers.find((barber) => barber.id === selectedBarber)!;

  const toggleService = (id: string) => {
    setSelectedServices((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      return [...current, id];
    });
  };

  return (
    <View style={styles.shell}>
      <StatusBar style="light" />
      <TopBar compact={tab !== "home"} onMenu={() => setTab("services")} onProfile={() => setTab("profile")} />
      {tab === "home" ? <HomeScreen onBook={() => setTab("booking")} onMenu={() => setTab("services")} /> : null}
      {tab === "services" ? (
        <ServicesScreen selectedServices={selectedServices} onToggleService={toggleService} total={selectedTotal} onBook={() => setTab("booking")} />
      ) : null}
      {tab === "booking" ? (
        <BookingScreen
          selectedBarber={selectedBarber}
          setSelectedBarber={setSelectedBarber}
          selectedDay={selectedDay}
          setSelectedDay={setSelectedDay}
          selectedTime={selectedTime}
          setSelectedTime={setSelectedTime}
          total={selectedTotal}
          barber={bookingBarber}
          confirmed={bookingConfirmed}
          onConfirm={() => setBookingConfirmed(true)}
        />
      ) : null}
      {tab === "profile" ? <ProfileScreen notice={profileNotice} onNotice={setProfileNotice} onBook={() => setTab("booking")} /> : null}
      <BottomNav active={tab} onChange={setTab} />
    </View>
  );
}

function TopBar({ compact, onMenu, onProfile }: { compact?: boolean; onMenu: () => void; onProfile: () => void }) {
  return (
    <View style={styles.topBar}>
      <Pressable accessibilityRole="button" accessibilityLabel="Open services" onPress={onMenu} style={styles.iconButton}>
        <Ionicons name="menu" size={25} color={c.emeraldLight} />
      </Pressable>
      <Text style={[styles.logo, compact && styles.logoCompact]}>L'ÉLITE</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Open profile" onPress={onProfile} style={styles.avatarFrame}>
        <Image source={{ uri: barbers[0].image }} style={styles.avatar} />
      </Pressable>
    </View>
  );
}

function HomeScreen({ onBook, onMenu }: { onBook: () => void; onMenu: () => void }) {
  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.homeContent} showsVerticalScrollIndicator={false}>
      <ImageBackground
        source={{
          uri: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=900&q=80"
        }}
        style={styles.hero}
        imageStyle={styles.heroImage}
      >
        <View style={styles.heroOverlay}>
          <View style={styles.brandPill}>
            <Text style={styles.brandPillText}>FASHION GENTS PARLOUR</Text>
          </View>
          <Text style={styles.heroTitle}>Quick. Clean.</Text>
          <Text style={styles.heroTitleAccent}>Professional.</Text>
          <Text style={styles.heroBody}>
            Experience premium grooming tailored for the modern gentleman. Precision cuts, straight razor shaves, and restorative treatments.
          </Text>
          <Pressable style={styles.goldButton} onPress={onBook}>
            <Text style={styles.goldButtonText}>Book Now</Text>
            <Ionicons name="arrow-forward" size={22} color="#0A0A0A" />
          </Pressable>
        </View>
      </ImageBackground>

      <View style={styles.availabilityCard}>
        <View style={styles.availabilityHead}>
          <View style={styles.availabilityTitleRow}>
            <Ionicons name="time-outline" size={24} color={c.emeraldLight} />
            <Text style={styles.availabilityTitle}>Today's{"\n"}Availability</Text>
          </View>
          <View style={styles.livePill}>
            <Text style={styles.liveText}>Live{"\n"}Status</Text>
          </View>
        </View>
        <View style={styles.divider} />
        {barbers.map((barber, index) => (
          <View key={barber.id} style={[styles.availabilityRow, index > 0 && styles.availabilityRowGap]}>
            <Image source={{ uri: barber.image }} style={styles.smallPortrait} />
            <View style={styles.availabilityPerson}>
              <Text style={styles.availabilityName}>
                {barber.id === "arthur" ? "Raj (Master Barber)" : "Amit (Senior Stylist)"}
              </Text>
              <Text style={styles.rating}>★ {barber.rating} ({barber.cuts})</Text>
            </View>
            <View style={styles.nextSlot}>
              <Text style={styles.nextSlotLabel}>Next{"\n"}Slot:</Text>
              <Text style={styles.nextSlotTime}>{barber.id === "arthur" ? "2:30\nPM" : "3:15\nPM"}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.sectionBlock}>
        <Text style={styles.sectionTitle}>Signature Services</Text>
        <Text style={styles.sectionSubtitle}>Precision, care, and tradition in every detail.</Text>
        <View style={styles.ruleGroup}>
          <View style={styles.rule} />
          <View style={styles.ruleShort} />
        </View>
        <SignatureCard title="Head Massage" description="Relieve tension." price={100} emerald />
        <SignatureCard title="Gents Facial" description="Deep cleanse & glow." price={300} />
        <Pressable style={styles.outlineButton} onPress={onMenu}>
          <Text style={styles.outlineButtonText}>VIEW FULL MENU</Text>
          <Ionicons name="arrow-forward" size={22} color={c.text} />
        </Pressable>
      </View>
    </ScrollView>
  );
}

function ServicesScreen({
  selectedServices,
  onToggleService,
  total,
  onBook
}: {
  selectedServices: string[];
  onToggleService: (id: string) => void;
  total: number;
  onBook: () => void;
}) {
  const [activeCategory, setActiveCategory] = useState("All Services");
  const filteredServices = activeCategory === "All Services" ? services : services.filter((service) => service.category === activeCategory);

  return (
    <View style={styles.tabPage}>
      <ScrollView contentContainerStyle={styles.servicesContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.centerTitle}>Our Services</Text>
        <Text style={styles.centerSubtitle}>Curated grooming experiences for the modern gentleman. Select your services below.</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryStrip}>
          {["All Services", "Basic Services", "Grooming", "Premium"].map((category) => (
            <Pressable key={category} style={[styles.categoryChip, activeCategory === category && styles.categoryChipActive]} onPress={() => setActiveCategory(category)}>
              <Text style={[styles.categoryText, activeCategory === category && styles.categoryTextActive]}>{category}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <View style={styles.serviceList}>
          {filteredServices.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              selected={selectedServices.includes(service.id)}
              onToggle={() => onToggleService(service.id)}
            />
          ))}
        </View>
      </ScrollView>
      <View style={styles.selectedDock}>
        <View>
          <Text style={styles.selectedLabel}>Selected ({selectedServices.length})</Text>
          <Text style={styles.selectedPrice}>₹{total}</Text>
        </View>
        <Pressable style={styles.dockButton} onPress={onBook}>
          <Text style={styles.dockButtonText}>Book Now</Text>
        </Pressable>
      </View>
    </View>
  );
}

function BookingScreen({
  selectedBarber,
  setSelectedBarber,
  selectedDay,
  setSelectedDay,
  selectedTime,
  setSelectedTime,
  total,
  barber,
  confirmed,
  onConfirm
}: {
  selectedBarber: "arthur" | "julian";
  setSelectedBarber: (id: "arthur" | "julian") => void;
  selectedDay: string;
  setSelectedDay: (day: string) => void;
  selectedTime: string;
  setSelectedTime: (time: string) => void;
  total: number;
  barber: (typeof barbers)[number];
  confirmed: boolean;
  onConfirm: () => void;
}) {
  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.bookingContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.appointmentTitle}>Select Appointment</Text>
      <Text style={styles.appointmentSubtitle}>Curate your grooming experience.</Text>

      <StepLabel index="1." label="Master Barber" />
      <View style={styles.barberGrid}>
        {barbers.map((barberOption) => (
          <Pressable
            key={barberOption.id}
            style={[styles.barberCard, selectedBarber === barberOption.id && styles.barberCardActive]}
            onPress={() => setSelectedBarber(barberOption.id)}
          >
            {selectedBarber === barberOption.id ? (
              <Ionicons name="checkmark-circle-outline" size={20} color={c.emeraldLight} style={styles.checkIcon} />
            ) : null}
            <Image source={{ uri: barberOption.image }} style={styles.barberImage} />
            <Text style={styles.barberName}>{barberOption.name}</Text>
            <Text style={styles.barberRole}>{barberOption.role}</Text>
          </Pressable>
        ))}
      </View>

      <StepLabel index="2." label="Date & Time" />
      <View style={styles.daysRow}>
        {[
          ["WED", "12"],
          ["THU", "13"],
          ["FRI", "14"],
          ["SAT", "15"]
        ].map(([day, number]) => (
          <Pressable key={day} style={[styles.dayCard, selectedDay === day && styles.dayCardActive]} onPress={() => setSelectedDay(day)}>
            <Text style={[styles.dayText, selectedDay === day && styles.dayTextActive]}>{day}</Text>
            <Text style={[styles.dayNumber, selectedDay === day && styles.dayNumberActive]}>{number}</Text>
          </Pressable>
        ))}
      </View>

      {timeGroups.map((group) => (
        <View key={group.label} style={styles.timeGroup}>
          <View style={styles.timeHeader}>
            <Ionicons name={group.icon} size={20} color={c.text} />
            <Text style={styles.timeHeaderText}>{group.label}</Text>
          </View>
          <View style={styles.timeSlots}>
            {group.slots.map((slot) => {
              const disabled = group.disabled.includes(slot);
              const active = selectedTime === slot;
              return (
                <Pressable
                  key={slot}
                  disabled={disabled}
                  style={[styles.timeChip, active && styles.timeChipActive, disabled && styles.timeChipDisabled]}
                  onPress={() => setSelectedTime(slot)}
                >
                  <Text style={[styles.timeChipText, active && styles.timeChipTextActive, disabled && styles.timeChipTextDisabled]}>{slot}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Booking Summary</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryTitleWrap}>
            <Text style={styles.summaryTitle}>The Royal Shave & Cut</Text>
            <Text style={styles.summaryMeta}>60 Mins · with {barber.name}</Text>
          </View>
          <Text style={styles.summaryPrice}>₹{total}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryRow}>
          <Text style={styles.totalLabel}>Total Value</Text>
          <Text style={styles.totalValue}>₹{total}</Text>
        </View>
        <View style={styles.depositBox}>
          <MaterialCommunityIcons name="lock-outline" size={30} color={c.gold} />
          <View style={styles.depositTextWrap}>
            <Text style={styles.depositText}>Advance Deposit{"\n"}Required</Text>
            <Text style={styles.depositMeta}>₹20 barber + ₹2 platform</Text>
          </View>
          <Text style={styles.depositAmount}>₹{bookingDeposit.totalInr}</Text>
        </View>
        <View style={styles.depositBreakdown}>
          <View style={styles.depositBreakdownRow}>
            <Text style={styles.depositBreakdownLabel}>Barber advance</Text>
            <Text style={styles.depositBreakdownValue}>₹{bookingDeposit.barberAdvanceInr}</Text>
          </View>
          <View style={styles.depositBreakdownRow}>
            <Text style={styles.depositBreakdownLabel}>Platform charge</Text>
            <Text style={styles.depositBreakdownValue}>₹{bookingDeposit.platformChargeInr}</Text>
          </View>
        </View>
      </View>

      {confirmed ? (
        <View style={styles.confirmationCard}>
          <Ionicons name="checkmark-circle" size={25} color={c.emeraldLight} />
          <View style={styles.confirmationCopy}>
            <Text style={styles.confirmationTitle}>Booking Confirmed</Text>
            <Text style={styles.confirmationText}>
              {selectedDay} at {selectedTime} with {barber.name}. Deposit split: ₹20 barber advance + ₹2 platform charge.
            </Text>
          </View>
        </View>
      ) : null}

      <Pressable style={styles.confirmButton} onPress={onConfirm}>
        <Text style={styles.confirmButtonText}>Pay ₹{bookingDeposit.totalInr} & Confirm Booking</Text>
        <Ionicons name="arrow-forward" size={24} color={c.muted} />
      </Pressable>
    </ScrollView>
  );
}

function ProfileScreen({ notice, onNotice, onBook }: { notice: string; onNotice: (notice: string) => void; onBook: () => void }) {
  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.profileContent} showsVerticalScrollIndicator={false}>
      <View style={styles.profileHero}>
        <View style={styles.profileImageWrap}>
          <Image source={{ uri: "https://images.unsplash.com/photo-1615109398623-88346a601842?auto=format&fit=crop&w=260&q=80" }} style={styles.profileImage} />
          <View style={styles.editDot}>
            <Ionicons name="pencil" size={13} color={c.bg} />
          </View>
        </View>
        <Text style={styles.profileName}>Amit Sharma</Text>
        <Text style={styles.profileEmail}>amit.sharma@elitegents.com</Text>
        <View style={styles.memberBadge}>
          <Ionicons name="star-outline" size={20} color={c.gold} />
          <Text style={styles.memberBadgeText}>ELITE MEMBER</Text>
        </View>
      </View>

      <View style={styles.noticePill}>
        <Ionicons name="information-circle-outline" size={18} color={c.emeraldLight} />
        <Text style={styles.noticeText}>{notice}</Text>
      </View>

      <View style={styles.loyaltyCard}>
        <View style={styles.loyaltyTop}>
          <View>
            <Text style={styles.loyaltyTitle}>The Royal Path</Text>
            <Text style={styles.loyaltyCopy}>Your journey to a complimentary master service.</Text>
          </View>
          <Text style={styles.visitCount}>
            <Text style={styles.visitCountGold}>4</Text>/5
          </Text>
        </View>
        <View style={styles.progressRail}>
          {[0, 1, 2, 3].map((step) => (
            <View key={step} style={styles.progressDone}>
              <Ionicons name="checkmark" size={18} color={c.text} />
            </View>
          ))}
          <View style={styles.progressFinal}>
            <Ionicons name="ribbon-outline" size={18} color={c.gold} />
          </View>
        </View>
        <Text style={styles.remainingText}>1 VISIT REMAINING</Text>
      </View>

      <View style={styles.nextAppointmentCard}>
        <View style={styles.calendarBadge}>
          <Ionicons name="calendar-outline" size={27} color={c.text} />
        </View>
        <Ionicons name="arrow-up" size={22} color="#373737" style={styles.cardArrow} />
        <Text style={styles.nextAppointmentTitle}>Next Appointment</Text>
        <Text style={styles.nextAppointmentText}>You have no upcoming bookings.</Text>
        <Pressable style={styles.bookServiceButton} onPress={onBook}>
          <Text style={styles.bookServiceText}>BOOK A SERVICE</Text>
        </Pressable>
      </View>

      <SettingsGroup title="Account" onSelect={onNotice} rows={[["person-outline", "Personal Info"], ["card-outline", "Payment Methods"], ["location-outline", "Addresses"]]} />
      <SettingsGroup title="Preferences" onSelect={onNotice} rows={[["notifications-outline", "Notifications"], ["globe-outline", "Language", "English"]]} />
      <Pressable style={styles.signOutButton} onPress={() => onNotice("Signed out of this demo session")}>
        <Ionicons name="log-out-outline" size={16} color={c.danger} />
        <Text style={styles.signOutText}>SIGN OUT</Text>
      </Pressable>
    </ScrollView>
  );
}

function StepLabel({ index, label }: { index: string; label: string }) {
  return (
    <Text style={styles.stepLabel}>
      <Text style={styles.stepIndex}>{index} </Text>
      {label}
    </Text>
  );
}

function ServiceCard({
  service,
  selected,
  onToggle
}: {
  service: (typeof services)[number];
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable style={[styles.serviceCard, service.premium && styles.premiumServiceCard]} onPress={onToggle}>
      {service.premium ? <Text style={styles.premiumTag}>★ Premium</Text> : null}
      <View style={styles.serviceHead}>
        <Text style={styles.serviceTitle}>{service.name}</Text>
        <MaterialCommunityIcons name={service.icon} size={25} color={c.gold} />
      </View>
      <Text style={styles.serviceDescription}>{service.description}</Text>
      <View style={styles.serviceDivider} />
      <View style={styles.serviceFoot}>
        <Text style={styles.servicePrice}>₹{service.price}</Text>
        <View style={[styles.addButton, selected && styles.addButtonActive]}>
          <Text style={styles.addButtonText}>{selected ? "✓ Added" : "+ Add"}</Text>
        </View>
      </View>
    </Pressable>
  );
}

function SignatureCard({ title, description, price, emerald }: { title: string; description: string; price: number; emerald?: boolean }) {
  return (
    <View style={[styles.signatureCard, emerald && styles.signatureEmerald]}>
      <View>
        <Text style={styles.signatureTitle}>{title}</Text>
        <Text style={styles.signatureDescription}>{description}</Text>
      </View>
      <Text style={[styles.signaturePrice, !emerald && styles.signaturePriceGold]}>₹{price}</Text>
    </View>
  );
}

function SettingsGroup({ title, rows, onSelect }: { title: string; rows: [keyof typeof Ionicons.glyphMap, string, string?][]; onSelect: (notice: string) => void }) {
  return (
    <View style={styles.settingsGroup}>
      <Text style={styles.settingsTitle}>{title}</Text>
      {rows.map(([icon, label, value]) => (
        <Pressable key={label} style={styles.settingsRow} onPress={() => onSelect(`${label} opened`)}>
          <Ionicons name={icon} size={24} color={c.text} />
          <Text style={styles.settingsLabel}>{label}</Text>
          {value ? <Text style={styles.settingsValue}>{value}</Text> : null}
          <Ionicons name="chevron-forward" size={22} color="#3D3D3D" />
        </Pressable>
      ))}
    </View>
  );
}

function BottomNav({ active, onChange }: { active: Tab; onChange: (tab: Tab) => void }) {
  const items: { tab: Tab; label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }[] = [
    { tab: "home", label: "Home", icon: "television" },
    { tab: "services", label: "Services", icon: "content-cut" },
    { tab: "booking", label: "Booking", icon: "calendar-month-outline" },
    { tab: "profile", label: "Profile", icon: "account-outline" }
  ];
  return (
    <View style={styles.bottomNav}>
      {items.map((item) => {
        const selected = active === item.tab;
        return (
          <Pressable key={item.tab} style={[styles.navItem, selected && styles.navItemActive]} onPress={() => onChange(item.tab)}>
            <MaterialCommunityIcons name={item.icon} size={24} color={selected ? c.emeraldLight : "#8D8B95"} />
            <Text style={[styles.navLabel, selected && styles.navLabelActive]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: c.bg },
  topBar: {
    height: 74,
    paddingHorizontal: 20,
    paddingTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#0D2A21",
    backgroundColor: c.bg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  logo: { color: "#16D89A", fontSize: 22, lineHeight: 26, fontWeight: "900", letterSpacing: -1 },
  logoCompact: { fontSize: 14, letterSpacing: 0.5 },
  iconButton: { width: 42, height: 42, alignItems: "flex-start", justifyContent: "center" },
  avatarFrame: { width: 42, height: 42, borderRadius: 999, borderWidth: 1, borderColor: c.emerald, padding: 2 },
  avatar: { width: "100%", height: "100%", borderRadius: 999 },
  page: { flex: 1, backgroundColor: c.bg },
  tabPage: { flex: 1, backgroundColor: c.bg },
  homeContent: { paddingBottom: 116 },
  hero: { minHeight: 518 },
  heroImage: { opacity: 0.34 },
  heroOverlay: { flex: 1, alignItems: "center", paddingHorizontal: 18, paddingTop: 66 },
  brandPill: { borderWidth: 1, borderColor: c.gold, borderRadius: 999, paddingHorizontal: 17, paddingVertical: 6, backgroundColor: "rgba(0,0,0,0.35)", marginBottom: 14 },
  brandPillText: { color: c.gold, fontSize: 11, lineHeight: 13, fontWeight: "900", letterSpacing: 1.6 },
  heroTitle: { color: c.text, fontSize: 42, lineHeight: 48, fontWeight: "900", letterSpacing: -1.4, textAlign: "center" },
  heroTitleAccent: { color: c.emeraldLight, fontSize: 44, lineHeight: 50, fontWeight: "900", fontStyle: "italic", letterSpacing: -1.6, textAlign: "center" },
  heroBody: { color: c.text, fontSize: 18, lineHeight: 28, textAlign: "center", marginTop: 22, maxWidth: 348 },
  goldButton: { height: 58, borderRadius: 999, backgroundColor: c.gold, paddingHorizontal: 28, flexDirection: "row", gap: 12, alignItems: "center", justifyContent: "center", marginTop: 30, minWidth: 164 },
  goldButtonText: { color: "#0A0A0A", fontSize: 17, fontWeight: "900" },
  availabilityCard: { marginHorizontal: 14, marginTop: -18, borderRadius: 8, backgroundColor: c.surface, borderWidth: 1, borderColor: "#343434", padding: 22 },
  availabilityHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  availabilityTitleRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  availabilityTitle: { color: c.text, fontSize: 25, lineHeight: 29, fontWeight: "900" },
  livePill: { borderWidth: 1, borderColor: c.emerald, backgroundColor: "rgba(6,78,59,0.35)", borderRadius: 999, paddingHorizontal: 18, paddingVertical: 7 },
  liveText: { color: c.emeraldLight, textAlign: "center", fontSize: 11, lineHeight: 12, fontWeight: "900", letterSpacing: 2 },
  divider: { height: 1, backgroundColor: "#343434", marginVertical: 16 },
  availabilityRow: { minHeight: 114, borderWidth: 1, borderColor: "#343434", borderRadius: 6, padding: 14, flexDirection: "row", alignItems: "center", gap: 12 },
  availabilityRowGap: { marginTop: 22 },
  smallPortrait: { width: 58, height: 58, borderRadius: 999, borderWidth: 1, borderColor: c.outline },
  availabilityPerson: { flex: 1 },
  availabilityName: { color: c.text, fontSize: 17, lineHeight: 23, fontWeight: "900" },
  rating: { color: c.text, marginTop: 7, fontSize: 12 },
  nextSlot: { alignItems: "center" },
  nextSlotLabel: { color: c.emeraldLight, fontSize: 15, lineHeight: 18, fontWeight: "900" },
  nextSlotTime: { marginTop: 5, backgroundColor: c.surface3, color: c.text, textAlign: "center", overflow: "hidden", borderRadius: 4, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, lineHeight: 18 },
  sectionBlock: { paddingHorizontal: 14, marginTop: 136 },
  sectionTitle: { color: c.text, fontSize: 31, lineHeight: 38, fontWeight: "900", letterSpacing: -0.8 },
  sectionSubtitle: { color: c.text, fontSize: 16, lineHeight: 25, marginTop: 10 },
  ruleGroup: { marginTop: 30, marginBottom: 15, gap: 5 },
  rule: { height: 1, backgroundColor: "#5A5A5A" },
  ruleShort: { height: 1, backgroundColor: "#5A5A5A" },
  signatureCard: { minHeight: 104, borderWidth: 1, borderColor: "#343434", borderRadius: 8, backgroundColor: c.surface, padding: 18, marginBottom: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  signatureEmerald: { backgroundColor: "#17211E" },
  signatureTitle: { color: c.text, fontSize: 24, fontWeight: "900", lineHeight: 30 },
  signatureDescription: { color: c.muted, fontSize: 14, marginTop: 4 },
  signaturePrice: { color: c.emeraldLight, fontSize: 18, fontWeight: "900" },
  signaturePriceGold: { color: c.gold },
  outlineButton: { height: 50, borderWidth: 1, borderColor: c.outlineLight, borderRadius: 6, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12 },
  outlineButtonText: { color: c.text, fontSize: 12, fontWeight: "900", letterSpacing: 1 },

  servicesContent: { paddingHorizontal: 12, paddingBottom: 138 },
  centerTitle: { color: c.text, fontSize: 27, lineHeight: 34, fontWeight: "900", textAlign: "center", marginTop: 12 },
  centerSubtitle: { color: c.text, fontSize: 14, lineHeight: 21, textAlign: "center", marginTop: 8, paddingHorizontal: 20 },
  categoryStrip: { gap: 8, paddingVertical: 25 },
  categoryChip: { borderRadius: 999, borderWidth: 1, borderColor: c.outline, paddingHorizontal: 15, paddingVertical: 8 },
  categoryChipActive: { backgroundColor: c.emerald, borderColor: c.emerald },
  categoryText: { color: c.text, fontSize: 11, fontWeight: "900", letterSpacing: 1.6 },
  categoryTextActive: { color: c.emeraldLight },
  serviceList: { gap: 16 },
  serviceCard: { borderWidth: 1, borderColor: "#1F1F1F", borderRadius: 8, backgroundColor: c.bgDeep, padding: 14 },
  premiumServiceCard: { borderColor: c.emeraldLight, backgroundColor: "#111D19" },
  premiumTag: { color: c.gold, fontSize: 10, fontWeight: "900", letterSpacing: 1.4, marginBottom: 5 },
  serviceHead: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  serviceTitle: { color: c.text, fontSize: 21, lineHeight: 25, fontWeight: "900", flex: 1 },
  serviceDescription: { color: c.text, fontSize: 12, lineHeight: 17, marginTop: 8 },
  serviceDivider: { height: 1, backgroundColor: "#2C2C2C", marginVertical: 14 },
  serviceFoot: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  servicePrice: { color: c.text, fontSize: 20, fontWeight: "900" },
  addButton: { borderRadius: 999, backgroundColor: c.surface, paddingHorizontal: 17, paddingVertical: 8 },
  addButtonActive: { backgroundColor: c.emerald },
  addButtonText: { color: c.emeraldLight, fontSize: 11, fontWeight: "900", letterSpacing: 1.2 },
  selectedDock: { position: "absolute", left: 12, right: 12, bottom: 83, borderWidth: 1, borderColor: c.outlineLight, borderRadius: 8, backgroundColor: c.surface, padding: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  selectedLabel: { color: c.text, fontSize: 11, fontWeight: "900", letterSpacing: 1.4 },
  selectedPrice: { color: c.gold, fontSize: 19, fontWeight: "900" },
  dockButton: { backgroundColor: c.emerald, borderRadius: 6, paddingHorizontal: 30, paddingVertical: 13 },
  dockButtonText: { color: c.emeraldLight, fontSize: 11, fontWeight: "900", letterSpacing: 1.2 },

  bookingContent: { paddingHorizontal: 20, paddingTop: 27, paddingBottom: 112 },
  appointmentTitle: { color: c.text, fontSize: 39, lineHeight: 46, fontWeight: "900", letterSpacing: -1.3 },
  appointmentSubtitle: { color: c.text, fontSize: 20, lineHeight: 29, marginTop: 12, marginBottom: 38 },
  stepLabel: { color: c.gold, fontSize: 14, fontWeight: "900", textTransform: "uppercase", letterSpacing: 3, marginBottom: 18 },
  stepIndex: { color: c.gold },
  barberGrid: { flexDirection: "row", gap: 10, marginBottom: 35 },
  barberCard: { flex: 1, minHeight: 180, backgroundColor: c.surface, borderWidth: 1, borderColor: c.outline, borderRadius: 10, alignItems: "center", justifyContent: "center", padding: 16 },
  barberCardActive: { backgroundColor: "#10241D", borderColor: c.emeraldLight, borderWidth: 2 },
  checkIcon: { position: "absolute", right: 13, top: 13 },
  barberImage: { width: 74, height: 74, borderRadius: 999, borderWidth: 1, borderColor: c.emeraldLight, marginBottom: 15 },
  barberName: { color: c.text, fontSize: 22, fontWeight: "900" },
  barberRole: { color: c.muted, fontSize: 14, fontWeight: "900", letterSpacing: 4, marginTop: 10 },
  daysRow: { flexDirection: "row", gap: 10, marginBottom: 34 },
  dayCard: { width: 76, height: 94, borderWidth: 1, borderColor: c.outline, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: c.surface },
  dayCardActive: { backgroundColor: c.emerald, borderColor: c.emeraldLight },
  dayText: { color: c.muted, fontSize: 14, fontWeight: "900", letterSpacing: 2 },
  dayTextActive: { color: c.emeraldLight },
  dayNumber: { color: c.text, fontSize: 31, fontWeight: "900" },
  dayNumberActive: { color: c.text },
  timeGroup: { marginBottom: 18 },
  timeHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  timeHeaderText: { color: c.text, fontSize: 15, fontWeight: "900", letterSpacing: 4 },
  timeSlots: { flexDirection: "row", flexWrap: "wrap", gap: 11 },
  timeChip: { borderWidth: 1, borderColor: c.outline, borderRadius: 999, minWidth: 82, height: 49, alignItems: "center", justifyContent: "center" },
  timeChipActive: { backgroundColor: c.emerald, borderColor: c.emeraldLight },
  timeChipDisabled: { opacity: 0.5 },
  timeChipText: { color: c.text, fontSize: 18 },
  timeChipTextActive: { color: c.emeraldLight },
  timeChipTextDisabled: { textDecorationLine: "line-through", color: c.outlineLight },
  summaryCard: { marginTop: 42, borderRadius: 10, backgroundColor: c.surface, borderWidth: 1, borderColor: c.outline, padding: 28 },
  summaryLabel: { color: c.text, fontSize: 14, fontWeight: "900", letterSpacing: 3, marginBottom: 22 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  summaryTitleWrap: { flex: 1 },
  summaryTitle: { color: c.text, fontSize: 22, lineHeight: 28, fontWeight: "900" },
  summaryMeta: { color: c.muted, fontSize: 15, marginTop: 4 },
  summaryPrice: { color: c.text, fontSize: 21, fontWeight: "900" },
  summaryDivider: { height: 1, backgroundColor: "#303030", marginVertical: 21 },
  totalLabel: { color: c.text, fontSize: 21 },
  totalValue: { color: c.text, fontSize: 21 },
  depositBox: { minHeight: 118, borderWidth: 1, borderColor: c.goldDeep, borderRadius: 8, marginTop: 27, padding: 20, flexDirection: "row", alignItems: "center", gap: 15 },
  depositTextWrap: { flex: 1 },
  depositText: { color: c.gold, fontSize: 20, lineHeight: 31, fontWeight: "900" },
  depositMeta: { color: c.text, fontSize: 12, lineHeight: 18, fontWeight: "900", letterSpacing: 1.1, marginTop: 3 },
  depositAmount: { color: c.gold, fontSize: 31, fontWeight: "900" },
  depositBreakdown: { borderWidth: 1, borderColor: "#303030", borderTopWidth: 0, borderBottomLeftRadius: 8, borderBottomRightRadius: 8, paddingHorizontal: 18, paddingVertical: 14, gap: 8 },
  depositBreakdownRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  depositBreakdownLabel: { color: c.muted, fontSize: 13, fontWeight: "800" },
  depositBreakdownValue: { color: c.text, fontSize: 14, fontWeight: "900" },
  confirmationCard: { marginTop: 18, borderWidth: 1, borderColor: c.emerald, borderRadius: 8, backgroundColor: "#10241D", padding: 16, flexDirection: "row", gap: 12 },
  confirmationCopy: { flex: 1 },
  confirmationTitle: { color: c.text, fontSize: 16, fontWeight: "900" },
  confirmationText: { color: c.muted, fontSize: 13, lineHeight: 19, marginTop: 4 },
  confirmButton: { height: 74, borderRadius: 8, backgroundColor: c.emerald, marginTop: 56, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  confirmButtonText: { color: c.muted, fontSize: 20, fontWeight: "900" },

  profileContent: { paddingHorizontal: 16, paddingBottom: 120 },
  profileHero: { alignItems: "center", paddingTop: 5, marginBottom: 78 },
  profileImageWrap: { width: 132, height: 132, borderRadius: 999, borderWidth: 2, borderColor: c.emerald, padding: 3, marginTop: 8 },
  profileImage: { width: "100%", height: "100%", borderRadius: 999 },
  editDot: { position: "absolute", right: -4, bottom: 8, width: 42, height: 42, borderRadius: 999, backgroundColor: c.emerald, alignItems: "center", justifyContent: "center" },
  profileName: { color: c.text, fontSize: 32, lineHeight: 39, fontWeight: "900", marginTop: 28 },
  profileEmail: { color: c.muted, fontSize: 17, marginTop: 9 },
  memberBadge: { marginTop: 22, borderWidth: 1, borderColor: c.outlineLight, borderRadius: 7, paddingHorizontal: 16, paddingVertical: 10, flexDirection: "row", alignItems: "center", gap: 10 },
  memberBadgeText: { color: c.gold, fontSize: 13, fontWeight: "900", letterSpacing: 2 },
  noticePill: { borderWidth: 1, borderColor: c.emerald, backgroundColor: "rgba(6,78,59,0.28)", borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 18, flexDirection: "row", alignItems: "center", gap: 8 },
  noticeText: { color: c.emeraldLight, fontSize: 13, fontWeight: "800" },
  loyaltyCard: { borderRadius: 8, backgroundColor: c.surface, borderWidth: 1, borderColor: c.outline, padding: 24, marginBottom: 24 },
  loyaltyTop: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  loyaltyTitle: { color: c.text, fontSize: 26, fontWeight: "900", lineHeight: 31 },
  loyaltyCopy: { color: c.text, fontSize: 17, lineHeight: 27, marginTop: 8, maxWidth: 230 },
  visitCount: { color: c.text, fontSize: 24, fontWeight: "900", marginTop: 47 },
  visitCountGold: { color: c.gold, fontSize: 34 },
  progressRail: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 32 },
  progressDone: { width: 38, height: 38, borderRadius: 999, backgroundColor: c.emerald, borderWidth: 1, borderColor: c.emeraldLight, alignItems: "center", justifyContent: "center" },
  progressFinal: { width: 38, height: 38, borderRadius: 999, borderWidth: 2, borderColor: "#424242", alignItems: "center", justifyContent: "center" },
  remainingText: { color: c.emeraldLight, textAlign: "right", marginTop: 26, fontSize: 13, fontWeight: "900", letterSpacing: 1.3 },
  nextAppointmentCard: { borderRadius: 8, backgroundColor: c.surface, borderWidth: 1, borderColor: c.outline, padding: 24, marginBottom: 40 },
  calendarBadge: { width: 49, height: 49, borderRadius: 7, borderWidth: 1, borderColor: c.outline, alignItems: "center", justifyContent: "center", marginBottom: 30 },
  cardArrow: { position: "absolute", right: 28, top: 26, transform: [{ rotate: "45deg" }] },
  nextAppointmentTitle: { color: c.text, fontSize: 25, fontWeight: "900", lineHeight: 31 },
  nextAppointmentText: { color: c.text, fontSize: 16, marginTop: 10 },
  bookServiceButton: { backgroundColor: c.emerald, borderRadius: 4, height: 38, alignItems: "center", justifyContent: "center", marginTop: 22 },
  bookServiceText: { color: c.text, fontSize: 12, fontWeight: "900", letterSpacing: 3 },
  settingsGroup: { borderRadius: 8, borderWidth: 1, borderColor: "#202020", overflow: "hidden", marginBottom: 26 },
  settingsTitle: { color: c.muted, textTransform: "uppercase", fontSize: 12, fontWeight: "900", letterSpacing: 2, paddingHorizontal: 24, paddingVertical: 17, backgroundColor: c.bgDeep },
  settingsRow: { height: 58, flexDirection: "row", alignItems: "center", paddingHorizontal: 24, borderTopWidth: 1, borderTopColor: "#202020", gap: 22 },
  settingsLabel: { color: c.text, fontSize: 17, flex: 1 },
  settingsValue: { color: c.muted, fontSize: 16 },
  signOutButton: { height: 47, borderWidth: 1, borderColor: c.outlineLight, borderRadius: 3, marginHorizontal: 24, marginTop: -18, marginBottom: 48, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  signOutText: { color: c.danger, fontSize: 12, fontWeight: "900", letterSpacing: 3 },

  bottomNav: { position: "absolute", left: 0, right: 0, bottom: 0, height: 74, borderTopWidth: 1, borderTopColor: "#0D2A21", backgroundColor: c.bgDeep, flexDirection: "row", alignItems: "center", justifyContent: "space-around", paddingHorizontal: 22 },
  navItem: { minWidth: 76, height: 58, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  navItemActive: { borderWidth: 1, borderColor: c.emerald, backgroundColor: "rgba(6,78,59,0.35)" },
  navLabel: { color: "#8D8B95", marginTop: 5, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.8 },
  navLabelActive: { color: "#16D89A" }
});
