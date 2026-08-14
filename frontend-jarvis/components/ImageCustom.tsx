import Image from "next/image";
import { cn } from "@/lib/utils";

interface ImageCustomProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  classNameCustom?: string;
}

export default function ImageCustom({
  src,
  alt,
  width = 100,
  height = 100,
  classNameCustom,
}: ImageCustomProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={cn("mx-auto mt-2", classNameCustom)}
    />
  );
}
