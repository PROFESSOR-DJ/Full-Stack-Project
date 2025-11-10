import heapq

class MaxHeap:
    def __init__(self):
        self.node = None

    # def swap(self, i, j):
    #     self.node[i], self.node[j] = self.node[j], self.node[i]

    def insert(self, lst, n):
        # maximum = float('-inf')
        # while n>0 and list[i]>maximum:
        #     maximum = list[i]
        #     heapq.heappush(max_heap,maximum)
        #     i+=1

        
        max_heap = [-x for x in lst]
        heapq.heapify(max_heap)
        sorted_customers = sorted(lst, reverse=True)
        print("sorted customer:", sorted_customers)

        valuable_cust = sorted_customers[:2]
        print("valuable Customers:", valuable_cust)

        deleted_cust = sorted_customers[-2:]
        print("dleted customers:", deleted_cust)

        for c in deleted_cust:
            sorted_customers.remove(c)

        print("customer details after deletion:", sorted_customers)
        return sorted_customers



obj = MaxHeap()
lst = [2000, 400, 350, 790, 4000, 1500, 2000, 4500, 3200, 1200]
obj.insert(lst, len(lst))
