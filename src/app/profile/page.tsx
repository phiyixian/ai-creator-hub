"use client";
import { useState } from "react";

export default function ProfilePage() {
  const [name, setName] = useState("Alex Creator");
  const [email, setEmail] = useState("alex@example.com");
  const [bio, setBio] = useState("Filmmaker exploring AI workflows.");
  const [persona, setPersona] = useState("videographer");

  return (
    <div className="space-y-8">
      <div className="rounded-xl border overflow-hidden">
        <div className="p-4 border-b font-medium">Creator profile</div>
        <div className="p-4 grid gap-4 sm:grid-cols-2">
          <label className="text-sm">
            Name
            <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-md border" />
          </label>
          <label className="text-sm">
            Email
            <input value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-md border" />
          </label>
          <label className="text-sm sm:col-span-2">
            Bio
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} className="mt-1 w-full min-h-24 rounded-md border p-3" />
          </label>
          <label className="text-sm">
            Persona
            <select value={persona} onChange={(e) => setPersona(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-md border">
              <option value="videographer">Videographer</option>
              <option value="photographer">Photographer</option>
              <option value="educator">Educator</option>
              <option value="streamer">Streamer</option>
              <option value="musician">Musician</option>
            </select>
          </label>
        </div>
      </div>

      <div className="rounded-xl border overflow-hidden">
        <div className="p-4 border-b font-medium flex items-center justify-between">
          <div>AWS connection</div>
          <button className="px-3 py-1.5 rounded-md border">Docs</button>
        </div>
        <div className="p-4 space-y-3">
          <p className="text-sm text-[var(--muted-foreground)] max-w-prose">
            Connect your AWS account to enable Bedrock model inference, Lambda automations, and multi-platform publishing via API Gateways.
          </p>
          <div className="flex gap-2">
            <button className="px-3 py-2 rounded-md bg-[var(--primary)] text-[var(--primary-foreground)]">Connect AWS</button>
            <button className="px-3 py-2 rounded-md border">Test connection</button>
          </div>
        </div>
      </div>
    </div>
  );
}