import type { APIRoute } from "astro";
import type { User } from "../../types";

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  try {
    // TODO: Integrate with Supabase through Astro.locals.supabase
    // const { data, error } = await locals.supabase
    //   .from('users')
    //   .select('*')
    //   .order('created_at', { ascending: false });

    // if (error) throw error;

    // Dummy data for development
    const users: User[] = [
      {
        id: "1",
        name: "Anna Kowalska",
        email: "anna.kowalska@example.com",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Anna",
        role: "Admin",
        createdAt: "2024-08-15T10:30:00.000Z",
      },
      {
        id: "2",
        name: "Jan Nowak",
        email: "jan.nowak@example.com",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jan",
        role: "User",
        createdAt: "2024-09-22T14:45:00.000Z",
      },
      {
        id: "3",
        name: "Maria Wiśniewska",
        email: "maria.wisniewska@example.com",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Maria",
        role: "User",
        createdAt: "2024-10-10T08:15:00.000Z",
      },
      {
        id: "4",
        name: "Piotr Zieliński",
        email: "piotr.zielinski@example.com",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Piotr",
        role: "Moderator",
        createdAt: "2024-11-05T16:20:00.000Z",
      },
      {
        id: "5",
        name: "Katarzyna Lewandowska",
        email: "katarzyna.lewandowska@example.com",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Katarzyna",
        role: "User",
        createdAt: "2024-12-01T12:00:00.000Z",
      },
    ];

    return new Response(JSON.stringify(users), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Failed to fetch users",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};
