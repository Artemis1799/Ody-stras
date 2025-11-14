using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace t5_back.Models
{
    public class Point
    {
        [Key]
        public Guid UUID { get; set; }
        
        [Required]
        public Guid Event_ID { get; set; }
        
        public float? Latitude { get; set; }
        
        public float? Longitude { get; set; }
        
        public string Commentaire { get; set; }
        
        public Guid? Image_ID { get; set; }
        
        public int? Ordre { get; set; }
        
        public bool Valide { get; set; } = false;
        
        public DateTime Created { get; set; } = DateTime.UtcNow;
        
        public DateTime Modified { get; set; } = DateTime.UtcNow;
        
        [ForeignKey("Event_ID")]
        public Evenement Evenement { get; set; }
        
		[JsonIgnore]
        public ICollection<Image_Point> ImagePoints { get; set; }
		[JsonIgnore]
        public ICollection<Point_Equipement>? PointEquipements { get; set; }
    }
}