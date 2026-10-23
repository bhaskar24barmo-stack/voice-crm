import VoiceView from "@/components/crm/VoiceView";
import { aiConfigured, sttConfigured } from "@/lib/config";
export const metadata = { title: "Voice — Voice CRM", robots: { index: false } };
export default function Page() { return <VoiceView sttReady={sttConfigured()} aiReady={aiConfigured()} />; }
