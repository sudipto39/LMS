// scripts/seedSampleLab.js
import { prisma, disconnectDB } from "../dist/config/db.js";

async function main() {
  console.log("Checking batches and supervisors...");
  const batch = await prisma.batch.findFirst({
    where: { isActive: true },
  });

  if (!batch) {
    console.log("No active batch found. Please create a batch first.");
    return;
  }

  const supervisor = await prisma.user.findFirst({
    where: { role: "SUPERVISOR" },
  });

  if (!supervisor) {
    console.log("No supervisor found.");
    return;
  }

  console.log(`Found Batch: "${batch.name}" (ID: ${batch.id}) and Supervisor: "${supervisor.name}" (ID: ${supervisor.id})`);

  // Check if sample lab already exists
  const existing = await prisma.labAssignment.findFirst({
    where: { batchId: batch.id, title: "Lab 3: Binary Search Trees & In-Order Traversal" },
  });

  if (existing) {
    console.log("Sample lab already exists:", existing.id);
    return;
  }

  const lab = await prisma.labAssignment.create({
    data: {
      title: "Lab 3: Binary Search Trees & In-Order Traversal",
      objective: "Understand divide-and-conquer strategy, implement balanced binary search tree insertions with O(log N) average time complexity, and produce sorted in-order sequence outputs.",
      prerequisites: "Recursion, Pointer/Reference manipulation, Binary Tree definitions, Big-O Notation",
      description: "Given N integer values, insert them sequentially into a Binary Search Tree. Then perform an in-order depth-first traversal and output the space-separated sorted sequence.\n\nInput Format:\nLine 1: An integer N (number of elements)\nLine 2: N space-separated integers\n\nOutput Format:\nSingle line of space-separated integers in ascending sorted order.",
      language: "python",
      starterCode: `# Python 3 — Lab 3: Binary Search Trees\n# Implement your solution below\n\nimport sys\n\nclass Node:\n    def __init__(self, val):\n        self.val = val\n        self.left = None\n        self.right = None\n\ndef insert(root, val):\n    if not root:\n        return Node(val)\n    if val < root.val:\n        root.left = insert(root.left, val)\n    else:\n        root.right = insert(root.right, val)\n    return root\n\ndef inorder(root, res):\n    if not root:\n        return\n    inorder(root.left, res)\n    res.append(str(root.val))\n    inorder(root.right, res)\n\ndef main():\n    lines = sys.stdin.read().split()\n    if not lines:\n        return\n    n = int(lines[0])\n    nums = [int(x) for x in lines[1:n+1]]\n    root = None\n    for x in nums:\n        root = insert(root, x)\n    res = []\n    inorder(root, res)\n    print(" ".join(res))\n\nif __name__ == '__main__':\n    main()\n`,
      testCases: [
        {
          id: "tc_bst_1",
          input: "5\n4 2 5 1 3",
          expectedOutput: "1 2 3 4 5",
          isHidden: false,
          weight: 1,
          explanation: "Public Sample 1: Standard 5-element BST insertion",
        },
        {
          id: "tc_bst_2",
          input: "6\n50 30 70 20 40 60",
          expectedOutput: "20 30 40 50 60 70",
          isHidden: false,
          weight: 1,
          explanation: "Public Sample 2: Multi-level BST insertion",
        },
        {
          id: "tc_bst_3",
          input: "8\n88 12 45 99 2 100 33 67",
          expectedOutput: "2 12 33 45 67 88 99 100",
          isHidden: true,
          weight: 2,
          explanation: "Hidden Test 1: Random array permutation",
        },
      ],
      timeLimit: 2.0,
      memoryLimit: 128000,
      totalPoints: 100,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      allowLate: true,
      status: "PUBLISHED",
      batchId: batch.id,
      creatorId: supervisor.id,
    },
  });

  console.log(`✅ Sample Lab Assignment created successfully: "${lab.title}" (ID: ${lab.id})`);
}

main()
  .catch((e) => {
    console.error("Error seeding sample lab:", e);
  })
  .finally(async () => {
    await disconnectDB();
  });
