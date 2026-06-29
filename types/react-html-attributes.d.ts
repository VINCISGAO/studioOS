import "react";

declare module "react" {
  interface VideoHTMLAttributes<T> {
    fetchPriority?: "high" | "low" | "auto";
  }

  interface ImgHTMLAttributes<T> {
    fetchPriority?: "high" | "low" | "auto";
  }
}
