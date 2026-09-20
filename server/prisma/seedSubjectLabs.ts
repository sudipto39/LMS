import "dotenv/config";
import { prisma, disconnectDB } from "../src/config/db.js";

async function main() {
  const supervisor = await prisma.user.findFirst({
    where: { role: { in: ["SUPERVISOR", "ADMIN"] } },
  });
  const batches = await prisma.batch.findMany({ select: { id: true, name: true } });

  if (!supervisor || batches.length === 0) {
    console.log("No supervisor or batch found.");
    return;
  }

  for (const b of batches) {
    const existing = await prisma.labAssignment.count({ where: { batchId: b.id } });
    if (existing === 0) {
      console.log(`Seeding subject folders for batch: ${b.name}`);

      await prisma.labAssignment.create({
        data: {
          title: "Lab 1: Binary Search Tree In-Order Traversal",
          subject: "Data Structures & Algorithms",
          objective: "Master recursive tree traversals and logarithmic search operations in binary search trees.",
          description: "Given an array of integers, construct a BST and print its sorted in-order traversal followed by the target element search result.",
          language: "all",
          totalPoints: 100,
          timeLimit: 2.0,
          memoryLimit: 128000,
          batchId: b.id,
          creatorId: supervisor.id,
          status: "PUBLISHED",
          starterCode: "# BST In-Order Traversal\ndef solve():\n    pass\n\nif __name__ == '__main__':\n    solve()\n",
          testCases: [
            { id: "tc1", input: "5\n4 2 5 1 3", expectedOutput: "1 2 3 4 5", isHidden: false, weight: 50, explanation: "Basic BST sort" },
            { id: "tc2", input: "3\n10 5 15", expectedOutput: "5 10 15", isHidden: true, weight: 50, explanation: "Hidden balance test" },
          ],
        },
      });

      await prisma.labAssignment.create({
        data: {
          title: "Lab 2: Round Robin CPU Scheduling Simulator",
          subject: "Operating Systems",
          objective: "Simulate preemptive Round-Robin scheduling algorithm with quantum time slice and calculate average turnaround & waiting time.",
          description: "Implement a process scheduler that takes quantum slice Q and process arrival/burst pairs, calculating execution timelines.",
          language: "all",
          totalPoints: 100,
          timeLimit: 2.0,
          memoryLimit: 128000,
          batchId: b.id,
          creatorId: supervisor.id,
          status: "PUBLISHED",
          starterCode: "# Round Robin Scheduler\ndef solve():\n    pass\n\nif __name__ == '__main__':\n    solve()\n",
          testCases: [
            { id: "tc1", input: "2\n3\n0 5\n1 3\n2 8", expectedOutput: "Avg Waiting Time: 5.33", isHidden: false, weight: 50, explanation: "Sample Q=2 calculation" },
            { id: "tc2", input: "4\n2\n0 10\n1 4", expectedOutput: "Avg Waiting Time: 4.00", isHidden: true, weight: 50, explanation: "Hidden burst test" },
          ],
        },
      });

      await prisma.labAssignment.create({
        data: {
          title: "Lab 3: Two-Phase Locking (2PL) Concurrency Control",
          subject: "Database Management Systems (DBMS)",
          objective: "Implement Strict 2-Phase Locking to prevent dirty reads and lost updates across concurrent database transactions.",
          description: "Read transaction sequence operations and grant Shared (S) or Exclusive (X) locks, detecting conflict serializability.",
          language: "all",
          totalPoints: 100,
          timeLimit: 2.0,
          memoryLimit: 128000,
          batchId: b.id,
          creatorId: supervisor.id,
          status: "PUBLISHED",
          starterCode: "# DBMS 2PL Locking Simulator\ndef solve():\n    pass\n\nif __name__ == '__main__':\n    solve()\n",
          testCases: [
            { id: "tc1", input: "T1: R(A), W(A)\nT2: R(A)", expectedOutput: "SERIALIZABLE: TRUE", isHidden: false, weight: 50, explanation: "Strict 2PL validation" },
            { id: "tc2", input: "T1: W(A)\nT2: W(A)", expectedOutput: "CONFLICT: WAIT", isHidden: true, weight: 50, explanation: "Hidden lock conflict" },
          ],
        },
      });

      await prisma.labAssignment.create({
        data: {
          title: "Lab 4: Dijkstra Shortest Path Routing Protocol",
          subject: "Computer Networks",
          objective: "Implement Link-State Routing algorithm using Dijkstra's shortest path mechanism for packet forward tables.",
          description: "Given a network graph topology of routers and edge costs, compute the routing forwarding table from source node.",
          language: "all",
          totalPoints: 100,
          timeLimit: 2.0,
          memoryLimit: 128000,
          batchId: b.id,
          creatorId: supervisor.id,
          status: "PUBLISHED",
          starterCode: "# Dijkstra Network Routing\ndef solve():\n    pass\n\nif __name__ == '__main__':\n    solve()\n",
          testCases: [
            { id: "tc1", input: "4\n0 1 1\n0 2 4\n1 2 2\n2 3 1", expectedOutput: "0->1:1 0->2:3 0->3:4", isHidden: false, weight: 50, explanation: "Basic 4-node topology" },
          ],
        },
      });
    }
  }

  console.log("? Subject folders seeded successfully.");
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await disconnectDB();
  });
