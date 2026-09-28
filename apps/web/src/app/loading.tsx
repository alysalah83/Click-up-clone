import Image from "next/image";
import wave from "@/../public/wave.gif";
import logo from "@/../public/logo.png";

function loading() {
  return (
    <div className="relative h-screen w-screen bg-neutral-50 dark:bg-neutral-900">
      <Image
        width={350}
        height={350}
        src={wave}
        alt="wave loading gif"
        className="absolute top-1/2 left-1/2 z-20 -translate-1/2"
      />
      <Image
        width={200}
        height={200}
        src={logo}
        alt="logo image"
        className="animate-scale absolute top-1/2 left-1/2 z-10 -translate-1/2"
      />
    </div>
  );
}

export default loading;
