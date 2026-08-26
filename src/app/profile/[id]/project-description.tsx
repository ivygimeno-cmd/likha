"use client";

import { useState } from "react";

type ProjectDescriptionProps = {
  description: string;
};

export default function ProjectDescription({
  description,
}: ProjectDescriptionProps) {
  const [isOpen, setIsOpen] = useState(false);

  const previewLength = 120;

  const preview =
    description.length > previewLength
      ? `${description.slice(0, previewLength).trim()}...`
      : description;

  return (
    <button
      type="button"
      onClick={() => setIsOpen((current) => !current)}
      className="mt-3 block w-full cursor-pointer text-left leading-7 text-[#173d32]/65"
    >
      {isOpen ? description : preview}
    </button>
  );
}