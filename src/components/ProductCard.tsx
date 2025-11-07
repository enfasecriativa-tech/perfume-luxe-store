import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { Card, CardContent, CardFooter } from "./ui/card";
import { Heart } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  id: string;
  image: string;
  brand: string;
  name: string;
  price: number;
  installments?: string;
}

const ProductCard = ({ id, image, brand, name, price, installments }: ProductCardProps) => {
  const { isFavorite, toggleFavorite, loading } = useFavorites();
  const favorited = isFavorite(id);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(id);
  };

  return (
    <Card className="group overflow-hidden border-border hover:shadow-lg transition-all duration-300">
      <Link to={`/produto/${id}`}>
        <div className="aspect-square overflow-hidden bg-secondary relative">
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <Button
            size="icon"
            variant="ghost"
            className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm hover:bg-background"
            onClick={handleFavoriteClick}
            disabled={loading}
          >
            <Heart
              className={cn(
                "h-5 w-5 transition-colors",
                favorited ? "fill-red-500 text-red-500" : "text-foreground"
              )}
            />
          </Button>
        </div>
      </Link>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
          {brand}
        </p>
        <Link to={`/produto/${id}`}>
          <h3 className="text-sm font-medium text-foreground line-clamp-2 mb-2 group-hover:text-primary transition-colors">
            {name}
          </h3>
        </Link>
        <div className="space-y-1">
          <p className="text-lg font-bold text-foreground">
            {price != null ? `R$ ${price.toFixed(2).replace(".", ",")}` : 'Preço sob consulta'}
          </p>
          {installments && (
            <p className="text-xs text-muted-foreground">{installments}</p>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button className="w-full bg-success hover:bg-success/90" size="sm" asChild>
          <Link to={`/produto/${id}`}>
            Ver Detalhes
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProductCard;
