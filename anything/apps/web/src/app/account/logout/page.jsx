import { useEffect } from "react";
import useAuth from "@/utils/useAuth";
import { Loader2 } from "lucide-react";

function LogoutPage() {
  const { signOut } = useAuth();

  useEffect(() => {
    signOut({
      callbackUrl: "/account/signin",
      redirect: true,
    });
  }, [signOut]);

  return (
    <div className="flex min-h-screen bg-gray-50 items-center justify-center p-4">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="animate-spin text-[#357AFF]" size={48} />
        <p className="text-gray-500 font-bold">جاري تسجيل الخروج...</p>
      </div>
    </div>
  );
}

export default LogoutPage;
