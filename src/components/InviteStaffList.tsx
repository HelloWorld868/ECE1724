'use client';

import { useState } from "react";

type User = {
    id: string;
    name: string | null;
    email: string;
};

export default function InviteUserList({
  allUsers,
  invitedUserIds,
}: {
  allUsers: User[];
  invitedUserIds: string[];
}) {
  const [query, setQuery] = useState("");

  const filteredUsers = allUsers.filter((u) =>
    (u.email || "").toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div>
      <input
        type="text"
        placeholder="Search by email"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="mb-4 w-full px-4 py-2 text-lg border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <div className="max-h-64 overflow-y-auto border rounded-md p-2">
        <ul className="space-y-3">
          {filteredUsers.length === 0 ? (
            <li className="text-xs text-gray-500">No users found.</li>
          ) : (
            filteredUsers.map((u) => (
              <li key={u.id}>
                <label className="text-lg flex items-center space-x-2">
                    <input
                        type="checkbox"
                        name="userIds"
                        value={u.id}
                        defaultChecked={invitedUserIds.includes(u.id)}
                        className="w-4 h-4"
                    />
                    <span>
                        {u.name ? (
                        <>
                            <span className="font-small">{u.name}</span>
                            <span className="ml-3 text-gray-500">({u.email})</span>
                        </>
                        ) : (
                        <span>{u.email}</span>
                        )}
                    </span>
                </label>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
